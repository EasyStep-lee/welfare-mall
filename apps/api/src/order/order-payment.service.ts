import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  InsufficientWelfareCardBalanceError,
  OrderPaymentRecord,
  OrderPaymentRepository,
  ProcessOrderPaymentCallbackResult
} from './order-payment.repository';
import { SettlementRepository } from '../settlement/settlement.repository';
import { OrderPaymentChannel, OrderPaymentChannels, OrderPaymentStatus, OrderPaymentStatuses } from './order-payment-status';
import { OrderStatuses } from './order-status';

export type CreateOrderPaymentInput = {
  requestId: string;
  orderNo: string;
  channel: OrderPaymentChannel;
  totalAmount: number;
  welfareCardPayableAmount: number;
  cashPayableAmount: number;
  welfareCardAccountId?: string | null;
};

export type CreateOrderPaymentResult = {
  idempotentReplay: boolean;
  payment: OrderPaymentRecord;
};

export type ProcessOrderPaymentCallbackServiceInput = {
  providerEventId: string;
  paymentNo: string;
  providerPaymentNo: string;
  status: OrderPaymentStatus;
  paidAt: Date | null;
  payload: unknown;
};

@Injectable()
export class OrderPaymentService {
  constructor(
    private readonly orderPaymentRepository: OrderPaymentRepository,
    private readonly settlementRepository: SettlementRepository
  ) {}

  async createPayment(input: CreateOrderPaymentInput): Promise<CreateOrderPaymentResult> {
    assertCreatePaymentInput(input);

    const normalizedInput = normalizeCreatePaymentInput(input);
    const existingPayment = await this.orderPaymentRepository.findPaymentByRequestId(normalizedInput.requestId);

    if (existingPayment) {
      if (!isSamePaymentRequest(existingPayment, normalizedInput)) {
        throw new ConflictException('requestId has already been used for a different payment request.');
      }

      return {
        idempotentReplay: true,
        payment: existingPayment
      };
    }

    const orderState = await this.orderPaymentRepository.findOrderStateByOrderNo(normalizedInput.orderNo);
    if (orderState?.status !== OrderStatuses.PendingPayment) {
      throw new ConflictException('order is not payable.');
    }

    const payment = await this.createPaymentRecord(normalizedInput);

    return {
      idempotentReplay: false,
      payment
    };
  }

  private async createPaymentRecord(input: CreateOrderPaymentInput): Promise<OrderPaymentRecord> {
    try {
      return await this.orderPaymentRepository.createPayment({
        paymentNo: createPaymentNo(),
        ...input
      });
    } catch (error) {
      if (error instanceof InsufficientWelfareCardBalanceError) {
        throw new ConflictException('franchise welfare card balance is insufficient.');
      }

      throw error;
    }
  }

  async processCallback(input: ProcessOrderPaymentCallbackServiceInput): Promise<ProcessOrderPaymentCallbackResult> {
    assertPaymentCallbackInput(input);

    const result = await this.orderPaymentRepository.processCallback({
      providerEventId: input.providerEventId.trim(),
      paymentNo: input.paymentNo.trim(),
      providerPaymentNo: input.providerPaymentNo.trim(),
      status: input.status,
      paidAt: input.paidAt,
      payload: input.payload
    });

    if (!result) {
      throw new NotFoundException(`Payment ${input.paymentNo} not found.`);
    }

    if (!result.duplicate && result.payment.status === OrderPaymentStatuses.Paid) {
      await this.settlementRepository.generateMerchantBillItemsForPaidOrder(result.payment.orderNo);
      await this.settlementRepository.generateFranchiseSalesLedgerForPaidOrder(result.payment.orderNo);
    }

    return result;
  }
}

function normalizeCreatePaymentInput(input: CreateOrderPaymentInput): CreateOrderPaymentInput {
  return {
    requestId: input.requestId.trim(),
    orderNo: input.orderNo.trim(),
    channel: input.channel,
    totalAmount: input.totalAmount,
    welfareCardPayableAmount: input.welfareCardPayableAmount,
    cashPayableAmount: input.cashPayableAmount,
    welfareCardAccountId: normalizeOptionalText(input.welfareCardAccountId)
  };
}

function assertCreatePaymentInput(input: CreateOrderPaymentInput): void {
  const messages: string[] = [];

  if (typeof input?.requestId !== 'string' || input.requestId.trim().length === 0) {
    messages.push('requestId is required.');
  }

  if (typeof input?.orderNo !== 'string' || input.orderNo.trim().length === 0) {
    messages.push('orderNo is required.');
  }

  if (!Object.values(OrderPaymentChannels).includes(input?.channel)) {
    messages.push('channel must be one of wechat, alipay.');
  }

  if (!Number.isInteger(input?.totalAmount) || input.totalAmount <= 0) {
    messages.push('totalAmount must be a positive integer.');
  }

  if (!Number.isInteger(input?.welfareCardPayableAmount) || input.welfareCardPayableAmount < 0) {
    messages.push('welfareCardPayableAmount must be a non-negative integer.');
  }

  if (!Number.isInteger(input?.cashPayableAmount) || input.cashPayableAmount < 0) {
    messages.push('cashPayableAmount must be a non-negative integer.');
  }

  if (
    input?.welfareCardAccountId !== undefined &&
    input.welfareCardAccountId !== null &&
    (typeof input.welfareCardAccountId !== 'string' || input.welfareCardAccountId.trim().length === 0)
  ) {
    messages.push('welfareCardAccountId must be a non-empty string when provided.');
  }

  if (
    Number.isInteger(input?.totalAmount) &&
    Number.isInteger(input?.welfareCardPayableAmount) &&
    Number.isInteger(input?.cashPayableAmount) &&
    input.welfareCardPayableAmount + input.cashPayableAmount !== input.totalAmount
  ) {
    messages.push('welfareCardPayableAmount plus cashPayableAmount must equal totalAmount.');
  }

  if (messages.length > 0) {
    throw new BadRequestException(messages);
  }
}

function assertPaymentCallbackInput(input: ProcessOrderPaymentCallbackServiceInput): void {
  const messages: string[] = [];

  if (typeof input?.providerEventId !== 'string' || input.providerEventId.trim().length === 0) {
    messages.push('providerEventId is required.');
  }

  if (typeof input?.paymentNo !== 'string' || input.paymentNo.trim().length === 0) {
    messages.push('paymentNo is required.');
  }

  if (typeof input?.providerPaymentNo !== 'string' || input.providerPaymentNo.trim().length === 0) {
    messages.push('providerPaymentNo is required.');
  }

  if (input?.status !== OrderPaymentStatuses.Paid && input?.status !== OrderPaymentStatuses.Failed) {
    messages.push('status must be paid or failed.');
  }

  if (input?.status === OrderPaymentStatuses.Paid && !(input.paidAt instanceof Date)) {
    messages.push('paidAt is required for paid callbacks.');
  }

  if (messages.length > 0) {
    throw new BadRequestException(messages);
  }
}

function isSamePaymentRequest(payment: OrderPaymentRecord, input: CreateOrderPaymentInput): boolean {
  return (
    payment.orderNo === input.orderNo &&
    payment.channel === input.channel &&
    payment.totalAmount === input.totalAmount &&
    payment.welfareCardPayableAmount === input.welfareCardPayableAmount &&
    payment.cashPayableAmount === input.cashPayableAmount
  );
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}

function createPaymentNo(): string {
  return `PAY-${new Date().toISOString().replace(/[-:.TZ]/g, '')}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}
