import { BadRequestException, Injectable } from '@nestjs/common';
import {
  OrderCheckoutLineRecord,
  OrderCheckoutPaymentRecord,
  OrderCheckoutRecord
} from './order-checkout.repository';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, OrderStatuses } from './order-status';
import { orderStateSelect } from './order-state.repository';

export type MerchantFulfillmentOrderRecord = OrderCheckoutRecord & {
  lines: OrderCheckoutLineRecord[];
  latestPayment: OrderCheckoutPaymentRecord | null;
};

export type CompletePaidOrderForMerchantInput = {
  merchantId: string;
  orderNo: string;
};

export type ListOrdersForMerchantInput = {
  merchantId: string;
  status: OrderStatus;
};

type OrderFulfillmentTransaction = {
  product: {
    findMany(args: unknown): Promise<Array<{ id: string }>>;
  };
  orderHeader: {
    findFirst(args: unknown): Promise<OrderCheckoutRecord | null>;
    update(args: unknown): Promise<OrderCheckoutRecord>;
  };
  orderState: {
    update(args: unknown): Promise<unknown>;
  };
};

@Injectable()
export class OrderFulfillmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listPaidOrdersForMerchant(merchantId: string): Promise<MerchantFulfillmentOrderRecord[]> {
    return this.listOrdersForMerchant({ merchantId, status: OrderStatuses.Paid });
  }

  async listOrdersForMerchant(input: ListOrdersForMerchantInput): Promise<MerchantFulfillmentOrderRecord[]> {
    const products = await this.prisma.product.findMany({
      where: { merchantId: input.merchantId },
      select: { id: true }
    });
    const productIds = products.map((product) => product.id);

    if (productIds.length === 0) {
      return [];
    }

    const orders = await this.prisma.orderHeader.findMany({
      where: {
        status: input.status,
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

  async completePaidOrderForMerchant(input: CompletePaidOrderForMerchantInput): Promise<MerchantFulfillmentOrderRecord | null> {
    return this.prisma.$transaction(async (prismaTx) => {
      const tx = prismaTx as unknown as OrderFulfillmentTransaction;
      const productIds = await findMerchantProductIds(tx, input.merchantId);

      if (productIds.length === 0) {
        return null;
      }

      const order = await tx.orderHeader.findFirst({
        where: {
          orderNo: input.orderNo,
          lines: { some: { productId: { in: productIds } } }
        },
        select: fulfillmentOrderSelect()
      });

      if (!order) {
        return null;
      }

      if (order.status !== OrderStatuses.Paid) {
        throw new BadRequestException('Only paid orders can be completed by merchant fulfillment.');
      }

      const completedOrder = await tx.orderHeader.update({
        where: { orderNo: input.orderNo },
        data: { status: OrderStatuses.Completed },
        select: fulfillmentOrderSelect()
      });
      await tx.orderState.update({
        where: { orderNo: input.orderNo },
        data: { status: OrderStatuses.Completed },
        select: orderStateSelect()
      });

      return {
        ...completedOrder,
        latestPayment: null
      };
    });
  }
}

async function findMerchantProductIds(client: { product: { findMany(args: unknown): Promise<Array<{ id: string }>> } }, merchantId: string) {
  const products = await client.product.findMany({
    where: { merchantId },
    select: { id: true }
  });

  return products.map((product) => product.id);
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
