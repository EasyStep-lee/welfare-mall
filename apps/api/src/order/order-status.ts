export type OrderStatus = 'draft' | 'pending_payment' | 'paid' | 'cancelled' | 'closed' | 'completed';

export type OrderAction = 'submit' | 'pay' | 'cancel' | 'close' | 'complete';

export type OrderActor = 'user' | 'system' | 'admin';

export const OrderStatuses = {
  Draft: 'draft',
  PendingPayment: 'pending_payment',
  Paid: 'paid',
  Cancelled: 'cancelled',
  Closed: 'closed',
  Completed: 'completed'
} as const satisfies Record<string, OrderStatus>;

export const OrderStatusCatalog: Array<{ code: OrderStatus; name: string; terminal: boolean }> = [
  { code: OrderStatuses.Draft, name: '草稿', terminal: false },
  { code: OrderStatuses.PendingPayment, name: '待支付', terminal: false },
  { code: OrderStatuses.Paid, name: '已支付', terminal: false },
  { code: OrderStatuses.Cancelled, name: '已取消', terminal: true },
  { code: OrderStatuses.Closed, name: '已关闭', terminal: true },
  { code: OrderStatuses.Completed, name: '已完成', terminal: true }
];
