import { Injectable } from '@nestjs/common';
import { OrderCheckoutPaymentRecord, OrderCheckoutRecord } from './order-checkout.repository';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, OrderStatuses } from './order-status';
import { orderStateSelect } from './order-state.repository';

export type MerchantFulfillmentOrderRecord = {
  id: string;
  taskNo: string;
  orderNo: string;
  requestId: string;
  buyerUserId: string;
  status: string;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  welfareCardPayableAmount: number;
  cashPayableAmount: number;
  fulfillmentType: string;
  receiverName: string | null;
  receiverPhone: string | null;
  receiverAddress: string | null;
  pickupStoreName: string | null;
  pickupCode: string | null;
  createdAt: Date;
  updatedAt: Date;
  lines: MerchantFulfillmentOrderLineRecord[];
  latestPayment: OrderCheckoutPaymentRecord | null;
};

export type MerchantFulfillmentOrderLineRecord = {
  id: string;
  orderLineId?: string;
  productId: string;
  skuId: string | null;
  displayName: string;
  displaySkuCode: string | null;
  displayImageUrl: string;
  unitPriceAmount: number;
  quantity: number;
  lineTotalAmount: number;
  createdAt: Date;
};

export type CompletePaidOrderForMerchantInput = {
  merchantId: string;
  orderNo: string;
  pickupCode?: string;
};

export type ListOrdersForMerchantInput = {
  merchantId: string;
  status: OrderStatus;
  orderNo?: string;
  taskNo?: string;
};

type OrderFulfillmentTransaction = {
  fulfillmentTask: {
    findFirst(args: unknown): Promise<FulfillmentTaskRecord | null>;
    update(args: unknown): Promise<FulfillmentTaskRecord>;
    count(args: unknown): Promise<number>;
  };
  orderHeader: {
    update(args: unknown): Promise<OrderCheckoutRecord>;
  };
  orderState: {
    update(args: unknown): Promise<unknown>;
  };
};

type FulfillmentTaskStatus = 'pending' | 'completed';

type FulfillmentTaskRecord = {
  id: string;
  taskNo: string;
  orderNo: string;
  merchantId: string;
  status: FulfillmentTaskStatus;
  fulfillmentType: string;
  receiverName: string | null;
  receiverPhone: string | null;
  receiverAddress: string | null;
  pickupStoreName: string | null;
  pickupCode: string | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  order: Omit<OrderCheckoutRecord, 'lines'>;
  lines: MerchantFulfillmentOrderLineRecord[];
};

@Injectable()
export class OrderFulfillmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listPaidOrdersForMerchant(merchantId: string): Promise<MerchantFulfillmentOrderRecord[]> {
    return this.listOrdersForMerchant({ merchantId, status: OrderStatuses.Paid });
  }

  async listOrdersForMerchant(input: ListOrdersForMerchantInput): Promise<MerchantFulfillmentOrderRecord[]> {
    const tasks = await this.prisma.fulfillmentTask.findMany({
      where: fulfillmentTaskWhere(input),
      orderBy: { createdAt: 'desc' },
      select: fulfillmentTaskSelect()
    });
    const orderNos = tasks.map((task) => task.orderNo);

    if (orderNos.length === 0) {
      return [];
    }

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

    return tasks.map((task) =>
      taskToFulfillmentOrder(task as FulfillmentTaskRecord, latestPaymentByOrderNo.get(task.orderNo) ?? null)
    );
  }

  async completePaidOrderForMerchant(input: CompletePaidOrderForMerchantInput): Promise<MerchantFulfillmentOrderRecord | null> {
    return this.prisma.$transaction(async (prismaTx) => {
      const tx = prismaTx as unknown as OrderFulfillmentTransaction;
      const task = await tx.fulfillmentTask.findFirst({
        where: {
          orderNo: input.orderNo,
          merchantId: input.merchantId,
          status: 'pending'
        },
        select: fulfillmentTaskSelect()
      });

      if (!task) {
        return null;
      }

      if (!canCompleteFulfillmentTask(task, input.pickupCode)) {
        return null;
      }

      const completedAt = new Date();
      const completedTask = await tx.fulfillmentTask.update({
        where: { id: task.id },
        data: {
          status: 'completed',
          completedAt
        },
        select: fulfillmentTaskSelect()
      });

      const remainingTasks = await tx.fulfillmentTask.count({
        where: {
          orderNo: input.orderNo,
          status: { not: 'completed' }
        }
      });

      if (remainingTasks === 0) {
        await tx.orderHeader.update({
          where: { orderNo: input.orderNo },
          data: { status: OrderStatuses.Completed },
          select: fulfillmentOrderSelect()
        });
        await tx.orderState.update({
          where: { orderNo: input.orderNo },
          data: { status: OrderStatuses.Completed },
          select: orderStateSelect()
        });
      }

      return taskToFulfillmentOrder(completedTask, null);
    });
  }
}

function canCompleteFulfillmentTask(task: FulfillmentTaskRecord, pickupCode: string | undefined): boolean {
  if (task.fulfillmentType !== 'pickup') {
    return true;
  }

  return typeof task.pickupCode === 'string' && task.pickupCode.length > 0 && task.pickupCode === pickupCode;
}

function toFulfillmentTaskStatus(status: OrderStatus): FulfillmentTaskStatus {
  return status === OrderStatuses.Completed ? 'completed' : 'pending';
}

function fulfillmentTaskWhere(input: ListOrdersForMerchantInput) {
  return {
    merchantId: input.merchantId,
    status: toFulfillmentTaskStatus(input.status),
    ...(input.orderNo ? { orderNo: input.orderNo } : {}),
    ...(input.taskNo ? { taskNo: input.taskNo } : {})
  };
}

function taskToFulfillmentOrder(
  task: FulfillmentTaskRecord,
  latestPayment: OrderCheckoutPaymentRecord | null
): MerchantFulfillmentOrderRecord {
  return {
    ...task.order,
    id: task.id,
    taskNo: task.taskNo,
    status: task.status === 'completed' ? OrderStatuses.Completed : OrderStatuses.Paid,
    fulfillmentType: task.fulfillmentType,
    receiverName: task.receiverName,
    receiverPhone: task.receiverPhone,
    receiverAddress: task.receiverAddress,
    pickupStoreName: task.pickupStoreName,
    pickupCode: task.pickupCode,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    lines: task.lines,
    latestPayment
  };
}

function fulfillmentTaskSelect() {
  return {
    id: true,
    taskNo: true,
    orderNo: true,
    merchantId: true,
    status: true,
    fulfillmentType: true,
    receiverName: true,
    receiverPhone: true,
    receiverAddress: true,
    pickupStoreName: true,
    pickupCode: true,
    completedAt: true,
    createdAt: true,
    updatedAt: true,
    order: {
      select: {
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
        updatedAt: true
      }
    },
    lines: {
      select: {
        id: true,
        orderLineId: true,
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
