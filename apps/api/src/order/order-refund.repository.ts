import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderRefundStatus, OrderRefundStatuses } from './order-refund-status';

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

type OrderRefundTransaction = {
  orderRefund: {
    findUnique(args: unknown): Promise<(OrderRefundRecord & { callbacks?: unknown[] }) | null>;
    update(args: unknown): Promise<OrderRefundRecord>;
  };
  orderRefundCallback: {
    findUnique(args: unknown): Promise<(OrderRefundCallbackRecord & { refund: OrderRefundRecord }) | null>;
    create(args: unknown): Promise<OrderRefundCallbackRecord>;
  };
};

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
    return this.prisma.orderRefund.create({
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
