export type OrderRefundStatus = 'processing' | 'succeeded' | 'failed';

export type OrderRefundChannel = 'wechat' | 'alipay' | 'cash';

export type OrderRefundReason = 'user_cancel' | 'merchant_out_of_stock' | 'after_sale';

export const OrderRefundStatuses = {
  Processing: 'processing',
  Succeeded: 'succeeded',
  Failed: 'failed'
} as const satisfies Record<string, OrderRefundStatus>;

export const OrderRefundChannels = {
  Wechat: 'wechat',
  Alipay: 'alipay',
  Cash: 'cash'
} as const satisfies Record<string, OrderRefundChannel>;

export const OrderRefundReasons = {
  UserCancel: 'user_cancel',
  MerchantOutOfStock: 'merchant_out_of_stock',
  AfterSale: 'after_sale'
} as const satisfies Record<string, OrderRefundReason>;

export const OrderRefundStatusCatalog: Array<{ code: OrderRefundStatus; name: string }> = [
  { code: OrderRefundStatuses.Processing, name: '退款处理中' },
  { code: OrderRefundStatuses.Succeeded, name: '退款成功' },
  { code: OrderRefundStatuses.Failed, name: '退款失败' }
];
