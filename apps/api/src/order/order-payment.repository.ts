import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderPaymentStatus, OrderPaymentStatuses } from './order-payment-status';
import { applySystemOrderTransition, ensurePendingPaymentOrderState, OrderStateClient } from './order-state.repository';

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
  orderPayment: {
    findUnique(args: unknown): Promise<(OrderPaymentRecord & { callbacks?: unknown[] }) | null>;
    update(args: unknown): Promise<OrderPaymentRecord>;
  };
  orderPaymentCallback: {
    findUnique(args: unknown): Promise<(OrderPaymentCallbackRecord & { payment: OrderPaymentRecord }) | null>;
    create(args: unknown): Promise<OrderPaymentCallbackRecord>;
  };
} & OrderStateClient;

@Injectable()
export class OrderPaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPaymentByRequestId(requestId: string): Promise<OrderPaymentRecord | null> {
    return this.prisma.orderPayment.findUnique({
      where: { requestId },
      select: paymentSelect()
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
    await applySystemOrderTransition(tx, {
      orderNo: payment.orderNo,
      action: 'pay',
      paidAt: input.paidAt
    });

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
