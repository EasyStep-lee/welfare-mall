import { Injectable } from '@nestjs/common';
import {
  OrderCheckoutLineRecord,
  OrderCheckoutPaymentRecord,
  OrderCheckoutRecord
} from './order-checkout.repository';
import { PrismaService } from '../prisma/prisma.service';

export type MerchantFulfillmentOrderRecord = OrderCheckoutRecord & {
  lines: OrderCheckoutLineRecord[];
  latestPayment: OrderCheckoutPaymentRecord | null;
};

@Injectable()
export class OrderFulfillmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listPaidOrdersForMerchant(merchantId: string): Promise<MerchantFulfillmentOrderRecord[]> {
    const products = await this.prisma.product.findMany({
      where: { merchantId },
      select: { id: true }
    });
    const productIds = products.map((product) => product.id);

    if (productIds.length === 0) {
      return [];
    }

    const orders = await this.prisma.orderHeader.findMany({
      where: {
        status: 'paid',
        lines: { some: { productId: { in: productIds } } }
      },
      orderBy: { createdAt: 'desc' },
      select: fulfillmentOrderSelect()
    });
    const orderNos = orders.map((order) => order.orderNo);
    const payments = await this.prisma.orderPayment.findMany({
      where: { orderNo: { in: orderNos } },
      orderBy: { createdAt: 'desc' },
      select: paymentSelect()
    });
    const latestPaymentByOrderNo = new Map<string, OrderCheckoutPaymentRecord>();

    for (const payment of payments) {
      if (!latestPaymentByOrderNo.has(payment.orderNo)) {
        latestPaymentByOrderNo.set(payment.orderNo, payment);
      }
    }

    return orders.map((order) => ({
      ...order,
      lines: order.lines.filter((line) => productIds.includes(line.productId)),
      latestPayment: latestPaymentByOrderNo.get(order.orderNo) ?? null
    }));
  }
}

function fulfillmentOrderSelect() {
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

function paymentSelect() {
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
