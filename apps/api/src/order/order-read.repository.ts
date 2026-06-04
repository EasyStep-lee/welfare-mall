import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderCheckoutPaymentRecord, OrderCheckoutRecord, OrderCheckoutRefundRecord } from './order-checkout.repository';
import { OrderStatus } from './order-status';

export type FindOrderForBuyerInput = {
  buyerUserId: string;
  orderNo: string;
};

export type ListRecentAdminOrdersInput = {
  status?: OrderStatus;
};

export type AdminOrderFulfillmentSummary = {
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
  taskNos: string[];
};

export type AdminOrderReadRecord = OrderCheckoutRecord & {
  fulfillmentSummary: AdminOrderFulfillmentSummary;
};

type FulfillmentTaskSummaryRecord = {
  orderNo: string;
  taskNo: string;
  status: string;
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

    return this.attachLatestOrderFacts(orders);
  }

  async listRecentAdminOrders(input: ListRecentAdminOrdersInput = {}): Promise<AdminOrderReadRecord[]> {
    const orders = await this.prisma.orderHeader.findMany({
      where: input.status ? { status: input.status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: orderReadSelect()
    });

    return this.attachLatestOrderFacts(orders, { includeFulfillmentSummary: true });
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

    const [orderWithFacts] = await this.attachLatestOrderFacts([order]);

    return orderWithFacts ?? null;
  }

  private async attachLatestOrderFacts(orders: OrderCheckoutRecord[]): Promise<OrderCheckoutRecord[]>;
  private async attachLatestOrderFacts(
    orders: OrderCheckoutRecord[],
    options: { includeFulfillmentSummary: true }
  ): Promise<AdminOrderReadRecord[]>;
  private async attachLatestOrderFacts(
    orders: OrderCheckoutRecord[],
    options: { includeFulfillmentSummary?: boolean } = {}
  ): Promise<OrderCheckoutRecord[] | AdminOrderReadRecord[]> {
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
    const refunds = await this.prisma.orderRefund.findMany({
      where: { orderNo: { in: orderNos } },
      orderBy: { createdAt: 'desc' },
      select: refundReadSelect()
    });
    const latestRefundByOrderNo = new Map<string, OrderCheckoutRefundRecord>();

    for (const payment of payments) {
      if (!latestPaymentByOrderNo.has(payment.orderNo)) {
        latestPaymentByOrderNo.set(payment.orderNo, payment);
      }
    }

    for (const refund of refunds) {
      if (!latestRefundByOrderNo.has(refund.orderNo)) {
        latestRefundByOrderNo.set(refund.orderNo, refund);
      }
    }

    if (options.includeFulfillmentSummary) {
      const tasks = await this.prisma.fulfillmentTask.findMany({
        where: { orderNo: { in: orderNos } },
        orderBy: { createdAt: 'asc' },
        select: fulfillmentTaskSummarySelect()
      });
      const fulfillmentSummaryByOrderNo = summarizeFulfillmentTasks(orderNos, tasks);

      return orders.map((order) => ({
        ...order,
        latestPayment: latestPaymentByOrderNo.get(order.orderNo) ?? null,
        latestRefund: latestRefundByOrderNo.get(order.orderNo) ?? null,
        fulfillmentSummary: fulfillmentSummaryByOrderNo.get(order.orderNo) ?? emptyFulfillmentSummary()
      }));
    }

    return orders.map((order) => ({
      ...order,
      latestPayment: latestPaymentByOrderNo.get(order.orderNo) ?? null,
      latestRefund: latestRefundByOrderNo.get(order.orderNo) ?? null
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

function refundReadSelect() {
  return {
    id: true,
    refundNo: true,
    requestId: true,
    paymentNo: true,
    orderNo: true,
    status: true,
    channel: true,
    refundAmount: true,
    reason: true,
    providerRefundNo: true,
    succeededAt: true,
    createdAt: true,
    updatedAt: true
  } as const;
}

function fulfillmentTaskSummarySelect() {
  return {
    orderNo: true,
    taskNo: true,
    status: true
  } as const;
}

function summarizeFulfillmentTasks(
  orderNos: string[],
  tasks: FulfillmentTaskSummaryRecord[]
): Map<string, AdminOrderFulfillmentSummary> {
  const summaryByOrderNo = new Map<string, AdminOrderFulfillmentSummary>();

  for (const orderNo of orderNos) {
    summaryByOrderNo.set(orderNo, emptyFulfillmentSummary());
  }

  for (const task of tasks) {
    const summary = summaryByOrderNo.get(task.orderNo) ?? emptyFulfillmentSummary();
    summary.totalTasks += 1;
    summary.taskNos.push(task.taskNo);

    if (task.status === 'completed') {
      summary.completedTasks += 1;
    } else {
      summary.pendingTasks += 1;
    }

    summaryByOrderNo.set(task.orderNo, summary);
  }

  return summaryByOrderNo;
}

function emptyFulfillmentSummary(): AdminOrderFulfillmentSummary {
  return {
    totalTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
    taskNos: []
  };
}
