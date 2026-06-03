const { formatMoney } = require('./format');

const OrderStatusText = {
  pending_payment: '待支付',
  paid: '已支付',
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
    totalText: formatMoney(order.totalAmount)
  };
}

function toOrderDetailDisplay(order) {
  return {
    ...toOrderSummaryDisplay(order),
    totalText: formatMoney(order.totalAmount),
    welfareCardText: formatMoney(order.welfareCardPayableAmount),
    cashText: formatMoney(order.cashPayableAmount),
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

module.exports = {
  toOrderDetailDisplay,
  toOrderSummaryDisplay
};
