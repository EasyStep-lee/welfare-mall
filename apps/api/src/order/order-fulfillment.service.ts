import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MerchantFulfillmentOrderRecord, OrderFulfillmentRepository } from './order-fulfillment.repository';

export type ListMerchantFulfillmentOrdersInput = {
  merchantId: string;
};

export type CompleteMerchantFulfillmentOrderInput = {
  merchantId: string;
  orderNo: string;
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

  async completeMerchantFulfillmentOrder(
    input: CompleteMerchantFulfillmentOrderInput
  ): Promise<{ order: MerchantFulfillmentOrderRecord }> {
    const merchantId = requireText(input.merchantId, 'merchantId');
    const orderNo = requireText(input.orderNo, 'orderNo');
    const order = await this.orderFulfillmentRepository.completePaidOrderForMerchant({ merchantId, orderNo });

    if (!order) {
      throw new NotFoundException('Merchant fulfillment order was not found.');
    }

    return { order };
  }
}

function requireText(value: string | undefined, fieldName: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new BadRequestException(`${fieldName} is required.`);
  }

  return value.trim();
}
