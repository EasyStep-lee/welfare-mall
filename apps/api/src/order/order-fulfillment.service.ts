import { BadRequestException, Injectable } from '@nestjs/common';
import { MerchantFulfillmentOrderRecord, OrderFulfillmentRepository } from './order-fulfillment.repository';

export type ListMerchantFulfillmentOrdersInput = {
  merchantId: string;
};

@Injectable()
export class OrderFulfillmentService {
  constructor(private readonly orderFulfillmentRepository: OrderFulfillmentRepository) {}

  async listMerchantFulfillmentOrders(
    input: ListMerchantFulfillmentOrdersInput
  ): Promise<{ orders: MerchantFulfillmentOrderRecord[] }> {
    const merchantId = requireText(input.merchantId, 'merchantId');
    const orders = await this.orderFulfillmentRepository.listPaidOrdersForMerchant(merchantId);

    return { orders };
  }
}

function requireText(value: string | undefined, fieldName: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new BadRequestException(`${fieldName} is required.`);
  }

  return value.trim();
}
