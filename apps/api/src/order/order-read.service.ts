import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderCheckoutRecord } from './order-checkout.repository';
import { OrderReadRepository } from './order-read.repository';
import { OrderStatus, OrderStatuses } from './order-status';

export type ListOrdersInput = {
  buyerUserId: string;
};

export type GetOrderDetailInput = {
  buyerUserId: string;
  orderNo: string;
};

export type ListAdminOrdersInput = {
  status?: string;
};

@Injectable()
export class OrderReadService {
  constructor(private readonly orderReadRepository: OrderReadRepository) {}

  async listOrders(input: ListOrdersInput): Promise<{ orders: OrderCheckoutRecord[] }> {
    const buyerUserId = requireText(input.buyerUserId, 'buyerUserId');
    const orders = await this.orderReadRepository.listOrdersByBuyer(buyerUserId);

    return { orders };
  }

  async listAdminOrders(input: ListAdminOrdersInput = {}): Promise<{ orders: OrderCheckoutRecord[] }> {
    const status = optionalOrderStatus(input.status, 'status');
    const orders = await this.orderReadRepository.listRecentAdminOrders({ status });

    return { orders };
  }

  async getOrderDetail(input: GetOrderDetailInput): Promise<{ order: OrderCheckoutRecord }> {
    const buyerUserId = requireText(input.buyerUserId, 'buyerUserId');
    const orderNo = requireText(input.orderNo, 'orderNo');
    const order = await this.orderReadRepository.findOrderForBuyer({ buyerUserId, orderNo });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    return { order };
  }
}

const orderStatuses = new Set<string>(Object.values(OrderStatuses));

function optionalOrderStatus(value: string | undefined, fieldName: string): OrderStatus | undefined {
  if (value === undefined || value.trim().length === 0) {
    return undefined;
  }

  const normalized = value.trim();

  if (!orderStatuses.has(normalized)) {
    throw new BadRequestException(`${fieldName} must be a known order status.`);
  }

  return normalized as OrderStatus;
}

function requireText(value: string | undefined, fieldName: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new BadRequestException(`${fieldName} is required.`);
  }

  return value.trim();
}
