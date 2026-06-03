import { OrderAction, OrderActor, OrderStatus, OrderStatuses } from './order-status';

export type OrderStatusTransition = {
  actor: OrderActor;
  fromStatus: OrderStatus;
  action: OrderAction;
  toStatus: OrderStatus;
  requiresReason: boolean;
};

export const OrderStatusTransitionCatalog: OrderStatusTransition[] = [
  {
    actor: 'user',
    fromStatus: OrderStatuses.Draft,
    action: 'submit',
    toStatus: OrderStatuses.PendingPayment,
    requiresReason: false
  },
  {
    actor: 'system',
    fromStatus: OrderStatuses.PendingPayment,
    action: 'pay',
    toStatus: OrderStatuses.Paid,
    requiresReason: false
  },
  {
    actor: 'user',
    fromStatus: OrderStatuses.PendingPayment,
    action: 'cancel',
    toStatus: OrderStatuses.Cancelled,
    requiresReason: true
  },
  {
    actor: 'system',
    fromStatus: OrderStatuses.PendingPayment,
    action: 'close',
    toStatus: OrderStatuses.Closed,
    requiresReason: true
  },
  {
    actor: 'admin',
    fromStatus: OrderStatuses.PendingPayment,
    action: 'close',
    toStatus: OrderStatuses.Closed,
    requiresReason: true
  },
  {
    actor: 'system',
    fromStatus: OrderStatuses.Paid,
    action: 'complete',
    toStatus: OrderStatuses.Completed,
    requiresReason: false
  },
  {
    actor: 'admin',
    fromStatus: OrderStatuses.Paid,
    action: 'complete',
    toStatus: OrderStatuses.Completed,
    requiresReason: false
  }
];

export type OrderStatusTransitionInput = {
  actor: OrderActor;
  currentStatus: OrderStatus;
  action: OrderAction;
};

export type OrderStatusTransitionResult =
  | {
      allowed: true;
      nextStatus: OrderStatus;
      requiresReason: boolean;
    }
  | {
      allowed: false;
      reason: string;
    };

export function applyOrderStatusTransition(input: OrderStatusTransitionInput): OrderStatusTransitionResult {
  const transition = OrderStatusTransitionCatalog.find(
    (item) => item.actor === input.actor && item.fromStatus === input.currentStatus && item.action === input.action
  );

  if (!transition) {
    return {
      allowed: false,
      reason: 'action not allowed for current actor and status'
    };
  }

  return {
    allowed: true,
    nextStatus: transition.toStatus,
    requiresReason: transition.requiresReason
  };
}
