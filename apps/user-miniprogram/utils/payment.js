const PaymentStatusText = {
  pending: '待支付',
  paid: '已支付',
  failed: '支付失败',
  closed: '已关闭',
  refunded: '已退款'
};

const PaymentChannelText = {
  wechat: '微信支付',
  alipay: '支付宝',
  cash: '现金'
};

function buildPaymentPayload(input) {
  const order = input.order || {};

  return {
    requestId: normalizeText(input.requestId),
    orderNo: normalizeText(order.orderNo),
    channel: normalizeText(input.channel),
    totalAmount: normalizeInteger(order.totalAmount),
    welfareCardPayableAmount: normalizeInteger(order.welfareCardPayableAmount),
    cashPayableAmount: normalizeInteger(order.cashPayableAmount)
  };
}

function createPaymentRequestId(orderNo, now = Date.now) {
  const safeOrderNo = normalizeText(orderNo).replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  return `mini-payment-${safeOrderNo}-${now()}`;
}

function toPaymentDisplay(payment) {
  return {
    paymentNo: payment.paymentNo,
    statusText: PaymentStatusText[payment.status] || payment.status,
    channelText: PaymentChannelText[payment.channel] || payment.channel
  };
}

function normalizeText(value) {
  return String(value ?? '').trim();
}

function normalizeInteger(value) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    return 0;
  }

  return parsed;
}

module.exports = {
  buildPaymentPayload,
  createPaymentRequestId,
  toPaymentDisplay
};
