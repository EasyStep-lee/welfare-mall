export type OrderPaymentStatus = 'pending' | 'paid' | 'failed';

export type OrderPaymentChannel = 'wechat' | 'alipay';

export const OrderPaymentStatuses = {
  Pending: 'pending',
  Paid: 'paid',
  Failed: 'failed'
} as const satisfies Record<string, OrderPaymentStatus>;

export const OrderPaymentChannels = {
  Wechat: 'wechat',
  Alipay: 'alipay'
} as const satisfies Record<string, OrderPaymentChannel>;

export const OrderPaymentChannelCatalog: Array<{ code: OrderPaymentChannel; name: string }> = [
  { code: OrderPaymentChannels.Wechat, name: '微信支付' },
  { code: OrderPaymentChannels.Alipay, name: '支付宝' }
];
