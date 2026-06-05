import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { CancelPendingPaymentOrderResult, OrderCancelRepository } from './order-cancel.repository';

export type CancelOrderInput = {
  orderNo: string;
  buyerUserId: string;
  reason: string;
};

@Injectable()
export class OrderCancelService {
  constructor(private readonly orderCancelRepository: OrderCancelRepository) {}

  async cancelOrder(input: CancelOrderInput): Promise<CancelPendingPaymentOrderResult> {
    const normalized = {
      orderNo: normalizeRequiredText(input.orderNo, 'orderNo'),
      buyerUserId: normalizeRequiredText(input.buyerUserId, 'buyerUserId'),
      reason: normalizeRequiredText(input.reason, 'reason')
    };

    const result = await this.orderCancelRepository.cancelPendingPaymentOrder(normalized);
    if (!result) {
      throw new ConflictException('order cannot be cancelled');
    }

    return result;
  }
}

function normalizeRequiredText(value: string | undefined, fieldName: string): string {
  const normalized = value?.trim();
  if (!normalized) {
    throw new BadRequestException(`${fieldName} is required.`);
  }

  return normalized;
}
