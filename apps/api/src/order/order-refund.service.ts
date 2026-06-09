import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderRefundRecord, OrderRefundRepository, ProcessOrderRefundCallbackResult } from './order-refund.repository';
import {
  OrderRefundChannel,
  OrderRefundChannels,
  OrderRefundReason,
  OrderRefundReasons,
  OrderRefundStatus,
  OrderRefundStatuses
} from './order-refund-status';
import { SettlementRepository } from '../settlement/settlement.repository';

export type CreateOrderRefundInput = {
  requestId: string;
  paymentNo: string;
  orderNo: string;
  channel: OrderRefundChannel;
  refundAmount: number;
  reason: OrderRefundReason;
};

export type CreateOrderRefundResult = {
  idempotentReplay: boolean;
  refund: OrderRefundRecord;
};

export type ProcessOrderRefundCallbackServiceInput = {
  providerEventId: string;
  refundNo: string;
  providerRefundNo: string;
  status: OrderRefundStatus;
  succeededAt: Date | null;
  payload: unknown;
};

@Injectable()
export class OrderRefundService {
  constructor(
    private readonly orderRefundRepository: OrderRefundRepository,
    private readonly settlementRepository: SettlementRepository
  ) {}

  async createRefund(input: CreateOrderRefundInput): Promise<CreateOrderRefundResult> {
    assertCreateRefundInput(input);

    const normalizedInput = normalizeCreateRefundInput(input);
    const existingRefund = await this.orderRefundRepository.findRefundByRequestId(normalizedInput.requestId);

    if (existingRefund) {
      if (!isSameRefundRequest(existingRefund, normalizedInput)) {
        throw new ConflictException('requestId has already been used for a different refund request.');
      }

      return {
        idempotentReplay: true,
        refund: existingRefund
      };
    }

    const refund = await this.orderRefundRepository.createRefund({
      refundNo: createRefundNo(),
      ...normalizedInput
    });

    return {
      idempotentReplay: false,
      refund
    };
  }

  async processCallback(input: ProcessOrderRefundCallbackServiceInput): Promise<ProcessOrderRefundCallbackResult> {
    assertRefundCallbackInput(input);

    const result = await this.orderRefundRepository.processCallback({
      providerEventId: input.providerEventId.trim(),
      refundNo: input.refundNo.trim(),
      providerRefundNo: input.providerRefundNo.trim(),
      status: input.status,
      succeededAt: input.succeededAt,
      payload: input.payload
    });

    if (!result) {
      throw new NotFoundException(`Refund ${input.refundNo} not found.`);
    }

    if (!result.duplicate && result.refund.status === OrderRefundStatuses.Succeeded) {
      await this.settlementRepository.applyRefundOffsetForSucceededRefund({
        orderNo: result.refund.orderNo,
        refundAmount: result.refund.refundAmount
      });
    }

    return result;
  }
}

function normalizeCreateRefundInput(input: CreateOrderRefundInput): CreateOrderRefundInput {
  return {
    requestId: input.requestId.trim(),
    paymentNo: input.paymentNo.trim(),
    orderNo: input.orderNo.trim(),
    channel: input.channel,
    refundAmount: input.refundAmount,
    reason: input.reason
  };
}

function assertCreateRefundInput(input: CreateOrderRefundInput): void {
  const messages: string[] = [];

  if (typeof input?.requestId !== 'string' || input.requestId.trim().length === 0) {
    messages.push('requestId is required.');
  }

  if (typeof input?.paymentNo !== 'string' || input.paymentNo.trim().length === 0) {
    messages.push('paymentNo is required.');
  }

  if (typeof input?.orderNo !== 'string' || input.orderNo.trim().length === 0) {
    messages.push('orderNo is required.');
  }

  if (!Object.values(OrderRefundChannels).includes(input?.channel)) {
    messages.push('channel must be one of wechat, alipay.');
  }

  if (!Number.isInteger(input?.refundAmount) || input.refundAmount <= 0) {
    messages.push('refundAmount must be a positive integer.');
  }

  if (!Object.values(OrderRefundReasons).includes(input?.reason)) {
    messages.push('reason must be one of user_cancel, merchant_out_of_stock, after_sale.');
  }

  if (messages.length > 0) {
    throw new BadRequestException(messages);
  }
}

function assertRefundCallbackInput(input: ProcessOrderRefundCallbackServiceInput): void {
  const messages: string[] = [];

  if (typeof input?.providerEventId !== 'string' || input.providerEventId.trim().length === 0) {
    messages.push('providerEventId is required.');
  }

  if (typeof input?.refundNo !== 'string' || input.refundNo.trim().length === 0) {
    messages.push('refundNo is required.');
  }

  if (typeof input?.providerRefundNo !== 'string' || input.providerRefundNo.trim().length === 0) {
    messages.push('providerRefundNo is required.');
  }

  if (input?.status !== OrderRefundStatuses.Succeeded && input?.status !== OrderRefundStatuses.Failed) {
    messages.push('status must be succeeded or failed.');
  }

  if (input?.status === OrderRefundStatuses.Succeeded && !(input.succeededAt instanceof Date)) {
    messages.push('succeededAt is required for succeeded callbacks.');
  }

  if (messages.length > 0) {
    throw new BadRequestException(messages);
  }
}

function isSameRefundRequest(refund: OrderRefundRecord, input: CreateOrderRefundInput): boolean {
  return (
    refund.paymentNo === input.paymentNo &&
    refund.orderNo === input.orderNo &&
    refund.channel === input.channel &&
    refund.refundAmount === input.refundAmount &&
    refund.reason === input.reason
  );
}

function createRefundNo(): string {
  return `REF-${new Date().toISOString().replace(/[-:.TZ]/g, '')}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}
