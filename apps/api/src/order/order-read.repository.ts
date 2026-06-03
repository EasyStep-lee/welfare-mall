import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderCheckoutPaymentRecord, OrderCheckoutRecord } from './order-checkout.repository';

export type FindOrderForBuyerInput = {
  buyerUserId: string;
  orderNo: string;
};

@Injectable()
export class OrderReadRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listOrdersByBuyer(buyerUserId: string): Promise<OrderCheckoutRecord[]> {
    const orders = await this.prisma.orderHeader.findMany({
      where: { buyerUserId },
      orderBy: { createdAt: 'desc' },
      select: orderReadSelect()
    });

    return this.attachLatestPayments(orders);
  }

  async findOrderForBuyer(input: FindOrderForBuyerInput): Promise<OrderCheckoutRecord | null> {
    const order = await this.prisma.orderHeader.findFirst({
      where: {
        buyerUserId: input.buyerUserId,
        orderNo: input.orderNo
      },
      select: orderReadSelect()
    });

    if (!order) {
      return null;
    }

    const [orderWithPayment] = await this.attachLatestPayments([order]);

    return orderWithPayment ?? null;
  }

  private async attachLatestPayments(orders: OrderCheckoutRecord[]): Promise<OrderCheckoutRecord[]> {
    const orderNos = orders.map((order) => order.orderNo);

    if (orderNos.length === 0) {
      return orders;
    }

    const payments = await this.prisma.orderPayment.findMany({
      where: { orderNo: { in: orderNos } },
      orderBy: { createdAt: 'desc' },
      select: paymentReadSelect()
    });
    const latestPaymentByOrderNo = new Map<string, OrderCheckoutPaymentRecord>();

    for (const payment of payments) {
      if (!latestPaymentByOrderNo.has(payment.orderNo)) {
        latestPaymentByOrderNo.set(payment.orderNo, payment);
      }
    }

    return orders.map((order) => ({
      ...order,
      latestPayment: latestPaymentByOrderNo.get(order.orderNo) ?? null
    }));
  }
}

function orderReadSelect() {
  return {
    id: true,
    orderNo: true,
    requestId: true,
    buyerUserId: true,
    status: true,
    subtotalAmount: true,
    discountAmount: true,
    totalAmount: true,
    welfareCardPayableAmount: true,
    cashPayableAmount: true,
    fulfillmentType: true,
    receiverName: true,
    receiverPhone: true,
    receiverAddress: true,
    pickupStoreName: true,
    createdAt: true,
    updatedAt: true,
    lines: {
      select: {
        id: true,
        orderId: true,
        productPoolItemId: true,
        productId: true,
        skuId: true,
        displayName: true,
        displaySkuCode: true,
        displayImageUrl: true,
        unitPriceAmount: true,
        quantity: true,
        lineTotalAmount: true,
        createdAt: true
      }
    }
  } as const;
}

function paymentReadSelect() {
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
