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
  fulfillmentStatus?: AdminFulfillmentStatusFilter;
  merchantId?: string;
};

export type AdminFulfillmentStatusFilter = 'pending' | 'completed';

export type AdminOrderFulfillmentSummary = {
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
  taskNos: string[];
};

export type AdminOrderFulfillmentTask = {
  taskNo: string;
  merchantId: string;
  status: string;
  createdAt: Date;
  completedAt: Date | null;
};

export type AdminOrderReadRecord = OrderCheckoutRecord & {
  fulfillmentSummary: AdminOrderFulfillmentSummary;
  fulfillmentTasks: AdminOrderFulfillmentTask[];
};

type FulfillmentTaskSummaryRecord = AdminOrderFulfillmentTask & {
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

    return this.attachLatestOrderFacts(orders);
  }

  async listRecentAdminOrders(input: ListRecentAdminOrdersInput = {}): Promise<AdminOrderReadRecord[]> {
    const fulfillmentOrderNos = input.fulfillmentStatus || input.merchantId
      ? await this.findOrderNosByFulfillmentFilters({
          status: input.fulfillmentStatus,
          merchantId: input.merchantId
        })
      : undefined;

    if (fulfillmentOrderNos?.length === 0) {
      return [];
    }

    const orders = await this.prisma.orderHeader.findMany({
      where: adminOrderWhere(input.status, fulfillmentOrderNos),
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

  private async findOrderNosByFulfillmentFilters(input: {
    status?: AdminFulfillmentStatusFilter;
    merchantId?: string;
  }): Promise<string[]> {
    const tasks = await this.prisma.fulfillmentTask.findMany({
      where: fulfillmentTaskFilterWhere(input.status, input.merchantId),
      orderBy: { createdAt: 'asc' },
      select: fulfillmentTaskSummarySelect()
    });
    const orderNos = uniqueOrderNos(tasks);

    if (input.merchantId) {
      return orderNos;
    }

    const summaries = summarizeFulfillmentTasks(orderNos, tasks);

    return orderNos.filter((orderNo) => {
      const summary = summaries.get(orderNo) ?? emptyFulfillmentSummary();

      if (input.status === 'pending') {
        return summary.pendingTasks > 0;
      }

      return summary.totalTasks > 0 && summary.pendingTasks === 0;
    });
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
      const fulfillmentTasksByOrderNo = groupFulfillmentTasksByOrderNo(orderNos, tasks);

      return orders.map((order) => ({
        ...order,
        latestPayment: latestPaymentByOrderNo.get(order.orderNo) ?? null,
        latestRefund: latestRefundByOrderNo.get(order.orderNo) ?? null,
        fulfillmentSummary: fulfillmentSummaryByOrderNo.get(order.orderNo) ?? emptyFulfillmentSummary(),
        fulfillmentTasks: fulfillmentTasksByOrderNo.get(order.orderNo) ?? []
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

function adminOrderWhere(status: OrderStatus | undefined, orderNos: string[] | undefined) {
  const where: Record<string, unknown> = {};

  if (status) {
    where.status = status;
  }

  if (orderNos) {
    where.orderNo = { in: orderNos };
  }

  return Object.keys(where).length > 0 ? where : undefined;
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
    merchantId: true,
    status: true,
    createdAt: true,
    completedAt: true
  } as const;
}

function fulfillmentTaskFilterWhere(
  status: AdminFulfillmentStatusFilter | undefined,
  merchantId: string | undefined
) {
  const where: Record<string, string> = {};

  if (merchantId) {
    where.merchantId = merchantId;
  }

  if (merchantId && status) {
    where.status = status;
  }

  return Object.keys(where).length > 0 ? where : undefined;
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

function groupFulfillmentTasksByOrderNo(
  orderNos: string[],
  tasks: FulfillmentTaskSummaryRecord[]
): Map<string, AdminOrderFulfillmentTask[]> {
  const tasksByOrderNo = new Map<string, AdminOrderFulfillmentTask[]>();

  for (const orderNo of orderNos) {
    tasksByOrderNo.set(orderNo, []);
  }

  for (const task of tasks) {
    const orderTasks = tasksByOrderNo.get(task.orderNo) ?? [];
    orderTasks.push({
      taskNo: task.taskNo,
      merchantId: task.merchantId,
      status: task.status,
      createdAt: task.createdAt,
      completedAt: task.completedAt
    });
    tasksByOrderNo.set(task.orderNo, orderTasks);
  }

  return tasksByOrderNo;
}

function uniqueOrderNos(tasks: FulfillmentTaskSummaryRecord[]): string[] {
  return [...new Set(tasks.map((task) => task.orderNo))];
}

function emptyFulfillmentSummary(): AdminOrderFulfillmentSummary {
  return {
    totalTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
    taskNos: []
  };
}
