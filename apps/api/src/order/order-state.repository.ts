import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderAction, OrderStatus, OrderStatuses } from './order-status';
import { applyOrderStatusTransition } from './order-status-transition';

export type OrderStateRecord = {
  id: string;
  orderNo: string;
  status: string;
  paidAt: Date | null;
  refundRequestedAt: Date | null;
  refundedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ApplySystemOrderTransitionInput = {
  orderNo: string;
  action: OrderAction;
  paidAt?: Date | null;
  refundRequestedAt?: Date | null;
  refundedAt?: Date | null;
};

export type OrderStateClient = {
  orderState: {
    upsert(args: unknown): Promise<OrderStateRecord>;
    findUnique(args: unknown): Promise<OrderStateRecord | null>;
    update(args: unknown): Promise<OrderStateRecord>;
  };
};

@Injectable()
export class OrderStateRepository {
  constructor(private readonly prisma: PrismaService) {}

  async ensurePendingPayment(orderNo: string): Promise<OrderStateRecord> {
    return ensurePendingPaymentOrderState(this.prisma, orderNo);
  }

  async applySystemTransition(input: ApplySystemOrderTransitionInput): Promise<OrderStateRecord | null> {
    return applySystemOrderTransition(this.prisma, input);
  }
}

export async function ensurePendingPaymentOrderState(client: OrderStateClient, orderNo: string): Promise<OrderStateRecord> {
  return client.orderState.upsert({
    where: { orderNo },
    create: {
      orderNo,
      status: OrderStatuses.PendingPayment
    },
    update: {},
    select: orderStateSelect()
  });
}

export async function applySystemOrderTransition(
  client: OrderStateClient,
  input: ApplySystemOrderTransitionInput
): Promise<OrderStateRecord | null> {
  const current = await client.orderState.findUnique({
    where: { orderNo: input.orderNo },
    select: orderStateSelect()
  });

  if (!current) {
    return null;
  }

  const transition = applyOrderStatusTransition({
    actor: 'system',
    currentStatus: current.status as OrderStatus,
    action: input.action
  });

  if (!transition.allowed) {
    return current;
  }

  return client.orderState.update({
    where: { orderNo: input.orderNo },
    data: buildTransitionData(input, transition.nextStatus),
    select: orderStateSelect()
  });
}

function buildTransitionData(input: ApplySystemOrderTransitionInput, nextStatus: OrderStatus): Record<string, unknown> {
  if (input.action === 'pay') {
    return {
      status: nextStatus,
      paidAt: input.paidAt ?? null
    };
  }

  if (input.action === 'refund_request') {
    return {
      status: nextStatus,
      refundRequestedAt: input.refundRequestedAt ?? null
    };
  }

  if (input.action === 'refund_succeed') {
    return {
      status: nextStatus,
      refundedAt: input.refundedAt ?? null
    };
  }

  return {
    status: nextStatus
  };
}

export function orderStateSelect() {
  return {
    id: true,
    orderNo: true,
    status: true,
    paidAt: true,
    refundRequestedAt: true,
    refundedAt: true,
    createdAt: true,
    updatedAt: true
  } as const;
}
