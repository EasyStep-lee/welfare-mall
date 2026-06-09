const { formatMoney } = require('./format');

const RefundStatusText = {
  processing: '退款处理中',
  succeeded: '退款成功',
  failed: '退款失败'
};

const RefundChannelText = {
  wechat: '微信支付',
  alipay: '支付宝'
};

function canRequestRefund(order) {
  return order?.status === 'paid' && order.latestPayment?.status === 'paid';
}

function buildRefundPayload(input) {
  const order = input.order || {};
  const latestPayment = order.latestPayment || {};

  return {
    requestId: normalizeText(input.requestId),
    paymentNo: normalizeText(latestPayment.paymentNo),
    orderNo: normalizeText(order.orderNo),
    channel: normalizeOnlinePaymentChannel(latestPayment.channel),
    refundAmount: normalizeInteger(order.totalAmount),
    reason: 'after_sale'
  };
}

function createRefundRequestId(orderNo, now = Date.now) {
  const safeOrderNo = normalizeText(orderNo).replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  return `mini-refund-${safeOrderNo}-${now()}`;
}

function toRefundDisplay(refund) {
  return {
    refundNo: refund.refundNo,
    statusText: RefundStatusText[refund.status] || refund.status,
    channelText: RefundChannelText[refund.channel] || '未知退款渠道',
    refundAmountText: formatMoney(refund.refundAmount)
  };
}

function normalizeText(value) {
  return String(value ?? '').trim();
}

function normalizeOnlinePaymentChannel(value) {
  return normalizeText(value) === 'alipay' ? 'alipay' : 'wechat';
}

function normalizeInteger(value) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    return 0;
  }

  return parsed;
}

module.exports = {
  buildRefundPayload,
  canRequestRefund,
  createRefundRequestId,
  toRefundDisplay
};
