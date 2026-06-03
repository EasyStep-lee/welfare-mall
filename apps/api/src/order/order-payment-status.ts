export type OrderPaymentStatus = 'pending' | 'paid' | 'failed';

export type OrderPaymentChannel = 'wechat' | 'alipay' | 'cash';

export const OrderPaymentStatuses = {
  Pending: 'pending',
  Paid: 'paid',
  Failed: 'failed'
} as const satisfies Record<string, OrderPaymentStatus>;

export const OrderPaymentChannels = {
  Wechat: 'wechat',
  Alipay: 'alipay',
  Cash: 'cash'
} as const satisfies Record<string, OrderPaymentChannel>;

export const OrderPaymentChannelCatalog: Array<{ code: OrderPaymentChannel; name: string }> = [
  { code: OrderPaymentChannels.Wechat, name: '微信支付' },
  { code: OrderPaymentChannels.Alipay, name: '支付宝' },
  { code: OrderPaymentChannels.Cash, name: '现金' }
];
