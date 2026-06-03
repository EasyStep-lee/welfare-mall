const { formatMoney } = require('./format');
const { toPaymentDisplay } = require('./payment');

const OrderStatusText = {
  pending_payment: '待支付',
  paid: '已支付',
  refund_processing: '退款处理中',
  cancelled: '已取消',
  refunded: '已退款'
};

function toOrderSummaryDisplay(order) {
  const lines = order.lines || [];

  return {
    orderNo: order.orderNo,
    statusText: formatStatus(order.status),
    firstLineName: lines[0]?.displayName || '订单商品',
    lineCountText: `${lines.length} 件商品`,
    totalText: formatMoney(order.totalAmount),
    paymentText: formatLatestPaymentText(order.latestPayment)
  };
}

function toOrderDetailDisplay(order) {
  return {
    ...toOrderSummaryDisplay(order),
    totalText: formatMoney(order.totalAmount),
    welfareCardText: formatMoney(order.welfareCardPayableAmount),
    cashText: formatMoney(order.cashPayableAmount),
    latestPaymentDisplay: order.latestPayment ? toPaymentDisplay(order.latestPayment) : null,
    receiverText: [order.receiverName, order.receiverPhone, order.receiverAddress].filter(Boolean).join(' / '),
    lines: (order.lines || []).map((line) => ({
      ...line,
      skuText: line.displaySkuCode || '默认规格',
      quantityText: `x${line.quantity}`,
      unitPriceText: formatMoney(line.unitPriceAmount),
      lineTotalText: formatMoney(line.lineTotalAmount)
    }))
  };
}

function formatStatus(status) {
  return OrderStatusText[status] || status;
}

function formatLatestPaymentText(payment) {
  if (!payment) {
    return '';
  }

  const paymentDisplay = toPaymentDisplay(payment);

  return `${paymentDisplay.channelText} ${paymentDisplay.statusText}`;
}

module.exports = {
  toOrderDetailDisplay,
  toOrderSummaryDisplay
};
