import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, OrderStatuses } from './order-status';
import { applyOrderStatusTransition } from './order-status-transition';
import { orderStateSelect, OrderStateClient, OrderStateRecord } from './order-state.repository';

export type CancelPendingPaymentOrderInput = {
  orderNo: string;
  buyerUserId: string;
  reason: string;
};

export type CancelledOrderRecord = {
  id: string;
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
  createdAt: Date;
  updatedAt: Date;
};

export type CancelPendingPaymentOrderResult = {
  order: CancelledOrderRecord;
};

type OrderCancelTransaction = {
  orderHeader: {
    findFirst(args: unknown): Promise<CancelledOrderRecord | null>;
    update(args: unknown): Promise<CancelledOrderRecord>;
  };
  inventoryReservation: {
    findMany(args: unknown): Promise<Array<{ productId: string; skuId: string | null; quantity: number }>>;
    updateMany(args: unknown): Promise<unknown>;
  };
  inventoryStock: {
    updateMany(args: unknown): Promise<unknown>;
  };
} & OrderStateClient;

@Injectable()
export class OrderCancelRepository {
  constructor(private readonly prisma: PrismaService) {}

  async cancelPendingPaymentOrder(input: CancelPendingPaymentOrderInput): Promise<CancelPendingPaymentOrderResult | null> {
    return this.prisma.$transaction(async (prismaTx) => {
      const tx = prismaTx as unknown as OrderCancelTransaction;
      const order = await tx.orderHeader.findFirst({
        where: {
          orderNo: input.orderNo,
          buyerUserId: input.buyerUserId,
          status: OrderStatuses.PendingPayment
        },
        select: orderHeaderSelect()
      });

      if (!order) {
        return null;
      }

      const nextState = await applyUserCancelTransition(tx, input.orderNo);
      if (nextState?.status !== OrderStatuses.Cancelled) {
        return null;
      }

      const cancelledOrder = await tx.orderHeader.update({
        where: { orderNo: input.orderNo },
        data: { status: OrderStatuses.Cancelled },
        select: orderHeaderSelect()
      });

      await releaseInventoryReservations(tx, input.orderNo, new Date());

      return { order: cancelledOrder };
    });
  }
}

async function applyUserCancelTransition(tx: OrderCancelTransaction, orderNo: string): Promise<OrderStateRecord | null> {
  const current = await tx.orderState.findUnique({
    where: { orderNo },
    select: orderStateSelect()
  });

  if (!current) {
    return null;
  }

  const transition = applyOrderStatusTransition({
    actor: 'user',
    currentStatus: current.status as OrderStatus,
    action: 'cancel'
  });

  if (!transition.allowed) {
    return current;
  }

  return tx.orderState.update({
    where: { orderNo },
    data: { status: transition.nextStatus },
    select: orderStateSelect()
  });
}

async function releaseInventoryReservations(tx: OrderCancelTransaction, orderNo: string, releasedAt: Date): Promise<void> {
  const reservations = await tx.inventoryReservation.findMany({
    where: {
      orderNo,
      status: 'reserved'
    },
    select: {
      productId: true,
      skuId: true,
      quantity: true
    }
  });

  if (reservations.length === 0) {
    return;
  }

  await tx.inventoryReservation.updateMany({
    where: {
      orderNo,
      status: 'reserved'
    },
    data: {
      status: 'released',
      releasedAt
    }
  });

  for (const reservation of reservations) {
    await tx.inventoryStock.updateMany({
      where: { stockKey: inventoryStockKey(reservation.productId, reservation.skuId) },
      data: {
        availableQuantity: { increment: reservation.quantity },
        reservedQuantity: { decrement: reservation.quantity }
      }
    });
  }
}

function inventoryStockKey(productId: string, skuId: string | null): string {
  return `${productId}:${skuId ?? 'default'}`;
}

function orderHeaderSelect() {
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
    salesFranchiseId: true,
    fulfillmentMerchantId: true,
    fulfillmentMerchantName: true,
    fulfillmentMerchantAddress: true,
    createdAt: true,
    updatedAt: true
  } as const;
}
