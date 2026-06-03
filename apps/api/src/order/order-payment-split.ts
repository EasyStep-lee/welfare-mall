import { BadRequestException } from '@nestjs/common';

export type OrderPaymentSplitInput = {
  totalAmount: number;
  welfareCardPaymentAmount?: number;
};

export type OrderPaymentSplitResult = {
  welfareCardPayableAmount: number;
  cashPayableAmount: number;
};

export function splitOrderPaymentAmount(input: OrderPaymentSplitInput): OrderPaymentSplitResult {
  const welfareCardPayableAmount = input.welfareCardPaymentAmount ?? 0;

  if (!Number.isInteger(input.totalAmount) || input.totalAmount < 0) {
    throw new BadRequestException('totalAmount must be a non-negative integer.');
  }

  if (!Number.isInteger(welfareCardPayableAmount) || welfareCardPayableAmount < 0) {
    throw new BadRequestException('welfareCardPaymentAmount must be a non-negative integer.');
  }

  if (welfareCardPayableAmount > input.totalAmount) {
    throw new BadRequestException('welfareCardPaymentAmount cannot exceed totalAmount.');
  }

  return {
    welfareCardPayableAmount,
    cashPayableAmount: input.totalAmount - welfareCardPayableAmount
  };
}
