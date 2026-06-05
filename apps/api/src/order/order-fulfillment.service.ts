import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MerchantFulfillmentOrderRecord, OrderFulfillmentRepository } from './order-fulfillment.repository';
import { OrderStatuses } from './order-status';

export type ListMerchantFulfillmentOrdersInput = {
  merchantId: string;
  status?: string;
  orderNo?: string;
  taskNo?: string;
};

export type MerchantFulfillmentStatus = typeof OrderStatuses.Paid | typeof OrderStatuses.Completed;

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
    const status = optionalMerchantFulfillmentStatus(input.status);
    const orders = await this.orderFulfillmentRepository.listOrdersForMerchant({
      merchantId,
      status,
      orderNo: optionalText(input.orderNo),
      taskNo: optionalText(input.taskNo)
    });

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

const fulfillmentStatuses = new Set<string>([OrderStatuses.Paid, OrderStatuses.Completed]);

function optionalMerchantFulfillmentStatus(value: string | undefined): MerchantFulfillmentStatus {
  if (value === undefined || value.trim().length === 0) {
    return OrderStatuses.Paid;
  }

  const normalized = value.trim();

  if (!fulfillmentStatuses.has(normalized)) {
    throw new BadRequestException('status must be paid or completed.');
  }

  return normalized as MerchantFulfillmentStatus;
}

function requireText(value: string | undefined, fieldName: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new BadRequestException(`${fieldName} is required.`);
  }

  return value.trim();
}

function optionalText(value: string | undefined): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
