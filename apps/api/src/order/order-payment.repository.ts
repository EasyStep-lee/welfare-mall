import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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

type OrderPaymentTransaction = {
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
    const payment = await this.prisma.orderPayment.create({
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

    await ensurePendingPaymentOrderState(this.prisma, input.orderNo);

    return payment;
  }

  async processCallback(input: ProcessOrderPaymentCallbackInput): Promise<ProcessOrderPaymentCallbackResult | null> {
    return this.prisma.$transaction(async (prismaTx) => {
      const tx = prismaTx as unknown as OrderPaymentTransaction;
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

async function updatePaymentFromCallback(
  tx: OrderPaymentTransaction,
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

async function createFulfillmentTasksForPaidOrder(tx: OrderPaymentTransaction, orderNo: string): Promise<void> {
  const order = await tx.orderHeader.findUnique({
    where: { orderNo },
    select: {
      orderNo: true,
      fulfillmentType: true,
      receiverName: true,
      receiverPhone: true,
      receiverAddress: true,
      pickupStoreName: true,
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
  tx: OrderPaymentTransaction
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
