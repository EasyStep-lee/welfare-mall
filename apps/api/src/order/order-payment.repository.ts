import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WelfareCardAccountStatuses, WelfareCardLedgerEntryTypes } from '../franchise/welfare-card-status';
import { OrderPaymentStatus, OrderPaymentStatuses } from './order-payment-status';
import { OrderStatuses } from './order-status';
import {
  applySystemOrderTransition,
  ensurePendingPaymentOrderState,
  OrderStateClient,
  OrderStateRecord,
  orderStateSelect
} from './order-state.repository';

export type OrderPaymentRecord = {
  id: string;
  paymentNo: string;
  requestId: string;
  orderNo: string;
  status: string;
  channel: string;
  totalAmount: number;
  welfareCardPayableAmount: number;
  cashPayableAmount: number;
  providerPaymentNo: string | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type OrderPaymentCallbackRecord = {
  id: string;
  paymentId: string;
  paymentNo: string;
  providerEventId: string;
  providerPaymentNo: string | null;
  status: string;
  payload: unknown;
  createdAt: Date;
};

export type CreateOrderPaymentRecordInput = {
  paymentNo: string;
  requestId: string;
  orderNo: string;
  channel: string;
  totalAmount: number;
  welfareCardPayableAmount: number;
  cashPayableAmount: number;
  welfareCardAccountId?: string | null;
};

export type ProcessOrderPaymentCallbackInput = {
  providerEventId: string;
  paymentNo: string;
  providerPaymentNo: string;
  status: OrderPaymentStatus;
  paidAt: Date | null;
  payload: unknown;
};

export type ProcessOrderPaymentCallbackResult = {
  duplicate: boolean;
  payment: OrderPaymentRecord;
  callback: OrderPaymentCallbackRecord;
};

export class InsufficientWelfareCardBalanceError extends Error {
  constructor(
    readonly details: {
      franchiseId: string;
      buyerUserId: string;
      requestedAmount: number;
      balanceAmount: number;
    }
  ) {
    super(
      `insufficient welfare card balance for franchise ${details.franchiseId}, buyer ${details.buyerUserId}`
    );
  }
}

type OrderPaymentCreateTransaction = {
  product: {
    findMany(args: unknown): Promise<Array<{ id: string; franchiseId: string }>>;
  };
  orderHeader: {
    findUnique(args: unknown): Promise<PayableOrderForWelfareCard | null>;
  };
  orderPayment: {
    create(args: unknown): Promise<OrderPaymentRecord>;
  };
  orderPaymentComponent: {
    createMany(args: unknown): Promise<unknown>;
  };
  welfareCardAccount: {
    findUnique(args: unknown): Promise<WelfareCardAccountForPayment | null>;
    update(args: unknown): Promise<WelfareCardAccountForPayment>;
  };
  welfareCardLedgerEntry: {
    create(args: unknown): Promise<unknown>;
  };
} & OrderStateClient;

type OrderPaymentCallbackTransaction = {
  product: {
    findMany(args: unknown): Promise<Array<{ id: string; merchantId: string }>>;
  };
  orderHeader: {
    findUnique(args: unknown): Promise<PaidOrderForFulfillment | null>;
    update(args: unknown): Promise<unknown>;
  };
  orderPayment: {
    findUnique(args: unknown): Promise<(OrderPaymentRecord & { callbacks?: unknown[] }) | null>;
    update(args: unknown): Promise<OrderPaymentRecord>;
  };
  orderPaymentCallback: {
    findUnique(args: unknown): Promise<(OrderPaymentCallbackRecord & { payment: OrderPaymentRecord }) | null>;
    create(args: unknown): Promise<OrderPaymentCallbackRecord>;
  };
  fulfillmentTask: {
    findUnique(args: unknown): Promise<unknown | null>;
    create(args: unknown): Promise<unknown>;
  };
  inventoryReservation: {
    createMany(args: unknown): Promise<unknown>;
  };
} & OrderStateClient;

type PaidOrderForFulfillment = {
  orderNo: string;
  fulfillmentType: string;
  receiverName: string | null;
  receiverPhone: string | null;
  receiverAddress: string | null;
  pickupStoreName: string | null;
  pickupCode?: string | null;
  lines: Array<{
    id: string;
    productId: string;
    skuId: string | null;
    displayName: string;
    displaySkuCode: string | null;
    displayImageUrl: string;
    unitPriceAmount: number;
    quantity: number;
    lineTotalAmount: number;
  }>;
};

type PayableOrderForWelfareCard = {
  orderNo: string;
  buyerUserId: string;
  lines: Array<{
    productId: string;
  }>;
};

type WelfareCardAccountForPayment = {
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

type WelfareCardPaymentDebitResult = {
  accountId: string;
  franchiseId: string;
  buyerUserId: string;
  amount: number;
} | null;

@Injectable()
export class OrderPaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPaymentByRequestId(requestId: string): Promise<OrderPaymentRecord | null> {
    return this.prisma.orderPayment.findUnique({
      where: { requestId },
      select: paymentSelect()
    });
  }

  async findOrderStateByOrderNo(orderNo: string): Promise<OrderStateRecord | null> {
    return this.prisma.orderState.findUnique({
      where: { orderNo },
      select: orderStateSelect()
    });
  }

  async createPayment(input: CreateOrderPaymentRecordInput): Promise<OrderPaymentRecord> {
    return this.prisma.$transaction(async (prismaTx) => {
      const tx = prismaTx as unknown as OrderPaymentCreateTransaction;

      const welfareCardDebit =
        input.welfareCardPayableAmount > 0 ? await debitWelfareCardForPayment(tx, input) : null;

      const payment = await tx.orderPayment.create({
        data: {
          paymentNo: input.paymentNo,
          requestId: input.requestId,
          orderNo: input.orderNo,
          status: OrderPaymentStatuses.Pending,
          channel: input.channel,
          totalAmount: input.totalAmount,
          welfareCardPayableAmount: input.welfareCardPayableAmount,
          cashPayableAmount: input.cashPayableAmount
        },
        select: paymentSelect()
      });

      await createPaymentComponents(tx, input, payment, welfareCardDebit);
      await ensurePendingPaymentOrderState(tx, input.orderNo);

      return payment;
    });
  }

  async processCallback(input: ProcessOrderPaymentCallbackInput): Promise<ProcessOrderPaymentCallbackResult | null> {
    return this.prisma.$transaction(async (prismaTx) => {
      const tx = prismaTx as unknown as OrderPaymentCallbackTransaction;
      const existingCallback = await tx.orderPaymentCallback.findUnique({
        where: { providerEventId: input.providerEventId },
        select: {
          ...callbackSelect(),
          payment: { select: paymentSelect() }
        }
      });

      if (existingCallback) {
        const { payment, ...callback } = existingCallback;
        return {
          duplicate: true,
          payment,
          callback
        };
      }

      const payment = await tx.orderPayment.findUnique({
        where: { paymentNo: input.paymentNo },
        select: paymentSelect()
      });

      if (!payment) {
        return null;
      }

      const callback = await tx.orderPaymentCallback.create({
        data: {
          paymentId: payment.id,
          paymentNo: input.paymentNo,
          providerEventId: input.providerEventId,
          providerPaymentNo: input.providerPaymentNo,
          status: input.status,
          payload: input.payload
        },
        select: callbackSelect()
      });

      const nextPayment = await updatePaymentFromCallback(tx, payment, input);

      return {
        duplicate: false,
        payment: nextPayment,
        callback
      };
    });
  }
}

async function debitWelfareCardForPayment(
  tx: OrderPaymentCreateTransaction,
  input: CreateOrderPaymentRecordInput
): Promise<WelfareCardPaymentDebitResult> {
  const order = (await tx.orderHeader.findUnique({
    where: { orderNo: input.orderNo },
    select: {
      orderNo: true,
      buyerUserId: true,
      lines: {
        select: {
          productId: true,
        }
      }
    }
  })) as PayableOrderForWelfareCard | null;

  const products = await tx.product.findMany({
    where: { id: { in: Array.from(new Set(order?.lines.map((line) => line.productId) ?? [])) } },
    select: { id: true, franchiseId: true }
  });
  const franchiseId = resolveSingleSalesFranchiseId(order, products);
  const buyerUserId = order?.buyerUserId ?? '';
  const welfareCardAccountId = normalizeOptionalId(input.welfareCardAccountId);
  const account = await tx.welfareCardAccount.findUnique({
    where: welfareCardAccountId
      ? { id: welfareCardAccountId }
      : {
          franchiseId_buyerUserId: {
            franchiseId,
            buyerUserId
          }
        },
    select: welfareCardAccountForPaymentSelect()
  });

  if (
    !account ||
    account.franchiseId !== franchiseId ||
    account.buyerUserId !== buyerUserId ||
    account.status !== WelfareCardAccountStatuses.Active ||
    account.balanceAmount < input.welfareCardPayableAmount
  ) {
    throw new InsufficientWelfareCardBalanceError({
      franchiseId,
      buyerUserId,
      requestedAmount: input.welfareCardPayableAmount,
      balanceAmount: account?.balanceAmount ?? 0
    });
  }

  const debitedAccount = await tx.welfareCardAccount.update({
    where: { id: account.id },
    data: { balanceAmount: { decrement: input.welfareCardPayableAmount } },
    select: welfareCardAccountForPaymentSelect()
  });

  await tx.welfareCardLedgerEntry.create({
    data: {
      ledgerNo: createWelfareCardPaymentLedgerNo(input.requestId),
      requestId: createWelfareCardPaymentRequestId(input.requestId),
      accountId: account.id,
      franchiseId,
      buyerUserId,
      type: WelfareCardLedgerEntryTypes.Payment,
      amount: -input.welfareCardPayableAmount,
      balanceAfter: debitedAccount.balanceAmount,
      orderNo: input.orderNo,
      remark: null
    },
    select: { id: true }
  });

  return {
    accountId: account.id,
    franchiseId,
    buyerUserId,
    amount: input.welfareCardPayableAmount
  };
}

async function createPaymentComponents(
  tx: OrderPaymentCreateTransaction,
  input: CreateOrderPaymentRecordInput,
  payment: OrderPaymentRecord,
  welfareCardDebit: WelfareCardPaymentDebitResult
): Promise<void> {
  const components: Array<{
    paymentId: string;
    paymentNo: string;
    orderNo: string;
    sequenceNo: number;
    componentType: string;
    channel: string;
    welfareCardAccountId: string | null;
    franchiseId: string | null;
    buyerUserId: string | null;
    amount: number;
    status: string;
  }> = [];

  if (welfareCardDebit) {
    components.push({
      paymentId: payment.id,
      paymentNo: input.paymentNo,
      orderNo: input.orderNo,
      sequenceNo: components.length + 1,
      componentType: 'welfare_card',
      channel: 'welfare_card',
      welfareCardAccountId: welfareCardDebit.accountId,
      franchiseId: welfareCardDebit.franchiseId,
      buyerUserId: welfareCardDebit.buyerUserId,
      amount: welfareCardDebit.amount,
      status: OrderPaymentStatuses.Pending
    });
  }

  if (input.cashPayableAmount > 0) {
    components.push({
      paymentId: payment.id,
      paymentNo: input.paymentNo,
      orderNo: input.orderNo,
      sequenceNo: components.length + 1,
      componentType: 'online_cash',
      channel: input.channel,
      welfareCardAccountId: null,
      franchiseId: welfareCardDebit?.franchiseId ?? null,
      buyerUserId: welfareCardDebit?.buyerUserId ?? null,
      amount: input.cashPayableAmount,
      status: OrderPaymentStatuses.Pending
    });
  }

  if (components.length === 0) {
    return;
  }

  await tx.orderPaymentComponent.createMany({
    data: components,
    skipDuplicates: true
  });
}

function resolveSingleSalesFranchiseId(
  order: PayableOrderForWelfareCard | null,
  products: Array<{ id: string; franchiseId: string }>
): string {
  const franchiseIdByProductId = new Map(products.map((product) => [product.id, product.franchiseId]));
  const franchiseIds = new Set(
    order?.lines.map((line) => franchiseIdByProductId.get(line.productId)).filter(isNonEmptyString) ?? []
  );

  if (!order || franchiseIds.size !== 1) {
    throw new InsufficientWelfareCardBalanceError({
      franchiseId: '',
      buyerUserId: order?.buyerUserId ?? '',
      requestedAmount: 0,
      balanceAmount: 0
    });
  }

  const [franchiseId] = Array.from(franchiseIds);
  if (!franchiseId) {
    throw new InsufficientWelfareCardBalanceError({
      franchiseId: '',
      buyerUserId: order.buyerUserId,
      requestedAmount: 0,
      balanceAmount: 0
    });
  }

  return franchiseId;
}

function isNonEmptyString(value: string | undefined): value is string {
  return typeof value === 'string' && value.length > 0;
}

function normalizeOptionalId(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}

async function updatePaymentFromCallback(
  tx: OrderPaymentCallbackTransaction,
  payment: OrderPaymentRecord,
  input: ProcessOrderPaymentCallbackInput
): Promise<OrderPaymentRecord> {
  if (input.status === OrderPaymentStatuses.Paid && payment.status !== OrderPaymentStatuses.Paid) {
    const orderState = await applySystemOrderTransition(tx, {
      orderNo: payment.orderNo,
      action: 'pay',
      paidAt: input.paidAt
    });
    if (orderState?.status === OrderStatuses.Paid) {
      await tx.orderHeader.update({
        where: { orderNo: payment.orderNo },
        data: { status: OrderStatuses.Paid }
      });
      await createFulfillmentTasksForPaidOrder(tx, payment.orderNo);

      return tx.orderPayment.update({
        where: { id: payment.id },
        data: {
          status: OrderPaymentStatuses.Paid,
          providerPaymentNo: input.providerPaymentNo,
          paidAt: input.paidAt
        },
        select: paymentSelect()
      });
    }

    return payment;
  }

  if (input.status === OrderPaymentStatuses.Failed && payment.status === OrderPaymentStatuses.Pending) {
    return tx.orderPayment.update({
      where: { id: payment.id },
      data: {
        status: OrderPaymentStatuses.Failed,
        providerPaymentNo: input.providerPaymentNo
      },
      select: paymentSelect()
    });
  }

  return payment;
}

async function createFulfillmentTasksForPaidOrder(tx: OrderPaymentCallbackTransaction, orderNo: string): Promise<void> {
  const order = await tx.orderHeader.findUnique({
    where: { orderNo },
    select: {
      orderNo: true,
      fulfillmentType: true,
      receiverName: true,
      receiverPhone: true,
      receiverAddress: true,
      pickupStoreName: true,
      salesFranchiseId: true,
      salesFranchiseName: true,
      fulfillmentMerchantId: true,
      fulfillmentMerchantName: true,
      fulfillmentMerchantAddress: true,
      lines: {
        select: {
          id: true,
          productId: true,
          skuId: true,
          displayName: true,
          displaySkuCode: true,
          displayImageUrl: true,
          unitPriceAmount: true,
          quantity: true,
          lineTotalAmount: true
        }
      }
    }
  });

  if (!order || order.lines.length === 0) {
    return;
  }

  const productIds = Array.from(new Set(order.lines.map((line) => line.productId)));
  const products = await tx.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, merchantId: true }
  });
  const merchantIdByProductId = new Map(products.map((product) => [product.id, product.merchantId]));
  const linesByMerchantId = new Map<string, PaidOrderForFulfillment['lines']>();

  for (const line of order.lines) {
    const merchantId = merchantIdByProductId.get(line.productId);

    if (!merchantId) {
      continue;
    }

    const lines = linesByMerchantId.get(merchantId) ?? [];
    lines.push(line);
    linesByMerchantId.set(merchantId, lines);
  }

  for (const [merchantId, lines] of linesByMerchantId) {
    const existingTask = await tx.fulfillmentTask.findUnique({
      where: { orderNo_merchantId: { orderNo, merchantId } },
      select: { id: true }
    });

    if (existingTask) {
      continue;
    }

    const taskNo = createFulfillmentTaskNo(orderNo, merchantId);

    await tx.fulfillmentTask.create({
      data: {
        taskNo,
        orderNo,
        merchantId,
        status: 'pending',
        fulfillmentType: order.fulfillmentType,
        receiverName: order.receiverName,
        receiverPhone: order.receiverPhone,
        receiverAddress: order.receiverAddress,
        pickupStoreName: order.pickupStoreName,
        pickupCode: createPickupCode(order.fulfillmentType, taskNo),
        lines: {
          create: lines.map((line) => ({
            orderLineId: line.id,
            productId: line.productId,
            skuId: line.skuId,
            displayName: line.displayName,
            displaySkuCode: line.displaySkuCode,
            displayImageUrl: line.displayImageUrl,
            unitPriceAmount: line.unitPriceAmount,
            quantity: line.quantity,
            lineTotalAmount: line.lineTotalAmount
          }))
        }
      },
      select: { id: true }
    });
  }

  await createInventoryReservationsForPaidOrder(order.orderNo, linesByMerchantId, tx);
}

async function createInventoryReservationsForPaidOrder(
  orderNo: string,
  linesByMerchantId: Map<string, PaidOrderForFulfillment['lines']>,
  tx: OrderPaymentCallbackTransaction
): Promise<void> {
  const reservations = Array.from(linesByMerchantId.entries()).flatMap(([merchantId, lines]) =>
    lines.map((line) => ({
      orderNo,
      orderLineId: line.id,
      productId: line.productId,
      skuId: line.skuId,
      merchantId,
      quantity: line.quantity,
      status: 'reserved',
      source: 'order_paid'
    }))
  );

  if (reservations.length === 0) {
    return;
  }

  await tx.inventoryReservation.createMany({
    data: reservations,
    skipDuplicates: true
  });
}

function createPickupCode(fulfillmentType: string, taskNo: string): string | null {
  return fulfillmentType === 'pickup' ? `WM_PICKUP:${taskNo}` : null;
}

function createFulfillmentTaskNo(orderNo: string, merchantId: string): string {
  const normalizedOrderNo = orderNo.replace(/[^A-Za-z0-9]+/g, '-').toUpperCase();
  const normalizedMerchantId = merchantId.replace(/[^A-Za-z0-9]+/g, '-').toUpperCase();

  return `FT-${normalizedOrderNo}-${normalizedMerchantId}-${Date.now()}`;
}

function createWelfareCardPaymentRequestId(paymentRequestId: string): string {
  return `payment:${paymentRequestId}`;
}

function createWelfareCardPaymentLedgerNo(paymentRequestId: string): string {
  return `WCL-PAYMENT-${paymentRequestId
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')}`;
}

function welfareCardAccountForPaymentSelect() {
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

function paymentSelect() {
  return {
    id: true,
    paymentNo: true,
    requestId: true,
    orderNo: true,
    status: true,
    channel: true,
    totalAmount: true,
    welfareCardPayableAmount: true,
    cashPayableAmount: true,
    providerPaymentNo: true,
    paidAt: true,
    createdAt: true,
    updatedAt: true
  } as const;
}

function callbackSelect() {
  return {
    id: true,
    paymentId: true,
    paymentNo: true,
    providerEventId: true,
    providerPaymentNo: true,
    status: true,
    payload: true,
    createdAt: true
  } as const;
}
