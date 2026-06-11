import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WelfareCardAccountStatuses, WelfareCardLedgerEntryTypes } from '../franchise/welfare-card-status';
import { OrderStatuses } from './order-status';
import { OrderRefundStatus, OrderRefundStatuses } from './order-refund-status';
import { applySystemOrderTransition, OrderStateClient } from './order-state.repository';

export type OrderRefundRecord = {
  id: string;
  refundNo: string;
  requestId: string;
  paymentNo: string;
  orderNo: string;
  status: string;
  channel: string;
  refundAmount: number;
  reason: string;
  providerRefundNo: string | null;
  succeededAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type OrderRefundCallbackRecord = {
  id: string;
  refundId: string;
  refundNo: string;
  providerEventId: string;
  providerRefundNo: string | null;
  status: string;
  payload: unknown;
  createdAt: Date;
};

export type CreateOrderRefundRecordInput = {
  refundNo: string;
  requestId: string;
  paymentNo: string;
  orderNo: string;
  channel: string;
  refundAmount: number;
  reason: string;
};

export type ProcessOrderRefundCallbackInput = {
  providerEventId: string;
  refundNo: string;
  providerRefundNo: string;
  status: OrderRefundStatus;
  succeededAt: Date | null;
  payload: unknown;
};

export type ProcessOrderRefundCallbackResult = {
  duplicate: boolean;
  refund: OrderRefundRecord;
  callback: OrderRefundCallbackRecord;
};

export class WelfareCardRefundCreditError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WelfareCardRefundCreditError';
  }
}

type OrderPaymentForRefundCredit = {
  paymentNo: string;
  orderNo: string;
  welfareCardPayableAmount: number;
};

type OrderForRefundCredit = {
  orderNo: string;
  buyerUserId: string;
  salesFranchiseId: string | null;
};

type WelfareCardAccountForRefundCredit = {
  id: string;
  accountNo: string;
  franchiseId: string;
  buyerUserId: string;
  status: string;
  balanceAmount: number;
  issuedAmount: number;
  createdAt: Date;
  updatedAt: Date;
};

type OrderRefundTransaction = {
  orderRefund: {
    findUnique(args: unknown): Promise<(OrderRefundRecord & { callbacks?: unknown[] }) | null>;
    update(args: unknown): Promise<OrderRefundRecord>;
  };
  orderRefundCallback: {
    findUnique(args: unknown): Promise<(OrderRefundCallbackRecord & { refund: OrderRefundRecord }) | null>;
    create(args: unknown): Promise<OrderRefundCallbackRecord>;
  };
  orderHeader: {
    findUnique(args: unknown): Promise<OrderForRefundCredit | null>;
    update(args: unknown): Promise<unknown>;
  };
  orderPayment: {
    findUnique(args: unknown): Promise<OrderPaymentForRefundCredit | null>;
  };
  welfareCardAccount: {
    findUnique(args: unknown): Promise<WelfareCardAccountForRefundCredit | null>;
    update(args: unknown): Promise<WelfareCardAccountForRefundCredit>;
  };
  welfareCardLedgerEntry: {
    create(args: unknown): Promise<unknown>;
  };
  inventoryReservation: {
    findMany(args: unknown): Promise<Array<{ productId: string; skuId: string | null; quantity: number }>>;
    updateMany(args: unknown): Promise<unknown>;
  };
  inventoryStock: {
    updateMany(args: unknown): Promise<unknown>;
  };
} & OrderStateClient;

@Injectable()
export class OrderRefundRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findRefundByRequestId(requestId: string): Promise<OrderRefundRecord | null> {
    return this.prisma.orderRefund.findUnique({
      where: { requestId },
      select: refundSelect()
    });
  }

  async createRefund(input: CreateOrderRefundRecordInput): Promise<OrderRefundRecord> {
    const refund = await this.prisma.orderRefund.create({
      data: {
        refundNo: input.refundNo,
        requestId: input.requestId,
        paymentNo: input.paymentNo,
        orderNo: input.orderNo,
        status: OrderRefundStatuses.Processing,
        channel: input.channel,
        refundAmount: input.refundAmount,
        reason: input.reason
      },
      select: refundSelect()
    });

    const orderState = await applySystemOrderTransition(this.prisma, {
      orderNo: input.orderNo,
      action: 'refund_request',
      refundRequestedAt: new Date()
    });
    if (orderState?.status === OrderStatuses.RefundProcessing) {
      await this.prisma.orderHeader.update({
        where: { orderNo: input.orderNo },
        data: { status: OrderStatuses.RefundProcessing }
      });
    }

    return refund;
  }

  async processCallback(input: ProcessOrderRefundCallbackInput): Promise<ProcessOrderRefundCallbackResult | null> {
    return this.prisma.$transaction(async (prismaTx) => {
      const tx = prismaTx as unknown as OrderRefundTransaction;
      const existingCallback = await tx.orderRefundCallback.findUnique({
        where: { providerEventId: input.providerEventId },
        select: {
          ...callbackSelect(),
          refund: { select: refundSelect() }
        }
      });

      if (existingCallback) {
        const { refund, ...callback } = existingCallback;
        return {
          duplicate: true,
          refund,
          callback
        };
      }

      const refund = await tx.orderRefund.findUnique({
        where: { refundNo: input.refundNo },
        select: refundSelect()
      });

      if (!refund) {
        return null;
      }

      const callback = await tx.orderRefundCallback.create({
        data: {
          refundId: refund.id,
          refundNo: input.refundNo,
          providerEventId: input.providerEventId,
          providerRefundNo: input.providerRefundNo,
          status: input.status,
          payload: input.payload
        },
        select: callbackSelect()
      });

      const nextRefund = await updateRefundFromCallback(tx, refund, input);

      return {
        duplicate: false,
        refund: nextRefund,
        callback
      };
    });
  }
}

async function updateRefundFromCallback(
  tx: OrderRefundTransaction,
  refund: OrderRefundRecord,
  input: ProcessOrderRefundCallbackInput
): Promise<OrderRefundRecord> {
  if (input.status === OrderRefundStatuses.Succeeded && refund.status !== OrderRefundStatuses.Succeeded) {
    const orderState = await applySystemOrderTransition(tx, {
      orderNo: refund.orderNo,
      action: 'refund_succeed',
      refundedAt: input.succeededAt
    });
    if (orderState?.status === OrderStatuses.Refunded) {
      await tx.orderHeader.update({
        where: { orderNo: refund.orderNo },
        data: { status: OrderStatuses.Refunded }
      });
    }
    await releaseInventoryReservations(tx, refund.orderNo, input.succeededAt);
    await creditWelfareCardForSucceededRefund(tx, refund);

    return tx.orderRefund.update({
      where: { id: refund.id },
      data: {
        status: OrderRefundStatuses.Succeeded,
        providerRefundNo: input.providerRefundNo,
        succeededAt: input.succeededAt
      },
      select: refundSelect()
    });
  }

  if (input.status === OrderRefundStatuses.Failed && refund.status === OrderRefundStatuses.Processing) {
    const orderState = await applySystemOrderTransition(tx, {
      orderNo: refund.orderNo,
      action: 'refund_fail'
    });
    if (orderState?.status === OrderStatuses.Paid) {
      await tx.orderHeader.update({
        where: { orderNo: refund.orderNo },
        data: { status: OrderStatuses.Paid }
      });
    }

    return tx.orderRefund.update({
      where: { id: refund.id },
      data: {
        status: OrderRefundStatuses.Failed,
        providerRefundNo: input.providerRefundNo
      },
      select: refundSelect()
    });
  }

  return refund;
}

async function creditWelfareCardForSucceededRefund(
  tx: OrderRefundTransaction,
  refund: OrderRefundRecord
): Promise<void> {
  const payment = await tx.orderPayment.findUnique({
    where: { paymentNo: refund.paymentNo },
    select: {
      paymentNo: true,
      orderNo: true,
      welfareCardPayableAmount: true
    }
  });

  if (!payment) {
    throw new WelfareCardRefundCreditError(`Payment ${refund.paymentNo} not found for refund ${refund.refundNo}.`);
  }

  const welfareCardRefundAmount = Math.min(payment.welfareCardPayableAmount, refund.refundAmount);
  if (welfareCardRefundAmount <= 0) {
    return;
  }

  const order = await tx.orderHeader.findUnique({
    where: { orderNo: refund.orderNo },
    select: {
      orderNo: true,
      buyerUserId: true,
      salesFranchiseId: true
    }
  });

  if (!order?.buyerUserId || !order.salesFranchiseId) {
    throw new WelfareCardRefundCreditError(
      `Order ${refund.orderNo} is missing buyer or sales franchise for welfare card refund.`
    );
  }

  const account = await tx.welfareCardAccount.findUnique({
    where: {
      franchiseId_buyerUserId: {
        franchiseId: order.salesFranchiseId,
        buyerUserId: order.buyerUserId
      }
    },
    select: welfareCardAccountForRefundCreditSelect()
  });

  if (!account) {
    throw new WelfareCardRefundCreditError(
      `Welfare card account not found for franchise ${order.salesFranchiseId} and buyer ${order.buyerUserId}.`
    );
  }

  if (account.status !== WelfareCardAccountStatuses.Active) {
    throw new WelfareCardRefundCreditError(`Welfare card account ${account.accountNo} is not active.`);
  }

  const creditedAccount = await tx.welfareCardAccount.update({
    where: { id: account.id },
    data: {
      balanceAmount: { increment: welfareCardRefundAmount }
    },
    select: welfareCardAccountForRefundCreditSelect()
  });

  await tx.welfareCardLedgerEntry.create({
    data: {
      ledgerNo: createWelfareCardRefundLedgerNo(refund.requestId),
      requestId: createWelfareCardRefundRequestId(refund.requestId),
      accountId: account.id,
      franchiseId: order.salesFranchiseId,
      buyerUserId: order.buyerUserId,
      type: WelfareCardLedgerEntryTypes.Refund,
      amount: welfareCardRefundAmount,
      balanceAfter: creditedAccount.balanceAmount,
      orderNo: refund.orderNo,
      remark: null
    },
    select: { id: true }
  });
}

async function releaseInventoryReservations(tx: OrderRefundTransaction, orderNo: string, releasedAt: Date | null): Promise<void> {
  const reservations = await tx.inventoryReservation.findMany({
    where: {
      orderNo,
      status: 'reserved'
    },
    select: {
      productId: true,
      skuId: true,
      quantity: true
    }
  });

  if (reservations.length === 0) {
    return;
  }

  await tx.inventoryReservation.updateMany({
    where: {
      orderNo,
      status: 'reserved'
    },
    data: {
      status: 'released',
      releasedAt
    }
  });

  for (const reservation of reservations) {
    await tx.inventoryStock.updateMany({
      where: { stockKey: inventoryStockKey(reservation.productId, reservation.skuId) },
      data: {
        availableQuantity: { increment: reservation.quantity },
        reservedQuantity: { decrement: reservation.quantity }
      }
    });
  }
}

function inventoryStockKey(productId: string, skuId: string | null): string {
  return `${productId}:${skuId ?? 'default'}`;
}

function refundSelect() {
  return {
    id: true,
    refundNo: true,
    requestId: true,
    paymentNo: true,
    orderNo: true,
    status: true,
    channel: true,
    refundAmount: true,
    reason: true,
    providerRefundNo: true,
    succeededAt: true,
    createdAt: true,
    updatedAt: true
  } as const;
}

function callbackSelect() {
  return {
    id: true,
    refundId: true,
    refundNo: true,
    providerEventId: true,
    providerRefundNo: true,
    status: true,
    payload: true,
    createdAt: true
  } as const;
}

function welfareCardAccountForRefundCreditSelect() {
  return {
    id: true,
    accountNo: true,
    franchiseId: true,
    buyerUserId: true,
    status: true,
    balanceAmount: true,
    issuedAmount: true,
    createdAt: true,
    updatedAt: true
  } as const;
}

function createWelfareCardRefundRequestId(refundRequestId: string): string {
  return `refund:${refundRequestId}`;
}

function createWelfareCardRefundLedgerNo(refundRequestId: string): string {
  const normalizedRequestId = refundRequestId
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `WCL-REFUND-${normalizedRequestId}`;
}
