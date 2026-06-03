export type OrderStatus =
  | 'draft'
  | 'pending_payment'
  | 'paid'
  | 'refund_processing'
  | 'refunded'
  | 'cancelled'
  | 'closed'
  | 'completed';

export type OrderAction = 'submit' | 'pay' | 'refund_request' | 'refund_succeed' | 'refund_fail' | 'cancel' | 'close' | 'complete';

export type OrderActor = 'user' | 'system' | 'admin';

export const OrderStatuses = {
  Draft: 'draft',
  PendingPayment: 'pending_payment',
  Paid: 'paid',
  RefundProcessing: 'refund_processing',
  Refunded: 'refunded',
  Cancelled: 'cancelled',
  Closed: 'closed',
  Completed: 'completed'
} as const satisfies Record<string, OrderStatus>;

export const OrderStatusCatalog: Array<{ code: OrderStatus; name: string; terminal: boolean }> = [
  { code: OrderStatuses.Draft, name: '草稿', terminal: false },
  { code: OrderStatuses.PendingPayment, name: '待支付', terminal: false },
  { code: OrderStatuses.Paid, name: '已支付', terminal: false },
  { code: OrderStatuses.RefundProcessing, name: '退款处理中', terminal: false },
  { code: OrderStatuses.Refunded, name: '已退款', terminal: true },
  { code: OrderStatuses.Cancelled, name: '已取消', terminal: true },
  { code: OrderStatuses.Closed, name: '已关闭', terminal: true },
  { code: OrderStatuses.Completed, name: '已完成', terminal: true }
];
