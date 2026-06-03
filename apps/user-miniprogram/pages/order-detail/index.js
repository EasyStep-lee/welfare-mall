const { requestJson } = require('../../utils/api');
const { toOrderDetailDisplay } = require('../../utils/order');
const { buildPaymentPayload, createPaymentRequestId, toPaymentDisplay } = require('../../utils/payment');
const { buildRefundPayload, canRequestRefund, createRefundRequestId, toRefundDisplay } = require('../../utils/refund');

const LOCAL_BUYER_USER_ID = 'local-user-001';

Page({
  data: {
    loading: true,
    error: '',
    order: null,
    orderDisplay: null,
    creatingPayment: false,
    payment: null,
    paymentDisplay: null,
    paymentError: '',
    requestingRefund: false,
    refund: null,
    refundDisplay: null,
    refundError: '',
    canRequestRefund: false
  },

  onLoad(options) {
    this.loadOrderDetail(options.orderNo);
  },

  async loadOrderDetail(orderNo) {
    if (!orderNo) {
      this.setData({ loading: false, error: '缺少订单参数' });
      return;
    }

    this.setData({ loading: true, error: '' });

    try {
      const decodedOrderNo = decodeURIComponent(orderNo);
      const response = await requestJson(
        `/orders/${encodeURIComponent(decodedOrderNo)}?buyerUserId=${encodeURIComponent(LOCAL_BUYER_USER_ID)}`
      );
      const order = response.order;

      this.setData({
        order,
        orderDisplay: toOrderDetailDisplay(order),
        loading: false,
        payment: null,
        paymentDisplay: null,
        paymentError: '',
        requestingRefund: false,
        refund: null,
        refundDisplay: null,
        refundError: '',
        canRequestRefund: canRequestRefund(order)
      });
    } catch (error) {
      this.setData({
        order: null,
        orderDisplay: null,
        loading: false,
        error: error instanceof Error ? error.message : '订单详情加载失败',
        canRequestRefund: false
      });
    }
  },

  async submitPayment() {
    if (!this.data.order) {
      this.setData({ paymentError: '缺少订单信息' });
      return;
    }

    this.setData({ creatingPayment: true, paymentError: '' });

    try {
      const response = await requestJson('/orders/payments', {
        method: 'POST',
        data: buildPaymentPayload({
          requestId: createPaymentRequestId(this.data.order.orderNo),
          order: this.data.order,
          channel: 'wechat'
        })
      });
      const payment = response.payment;

      this.setData({
        creatingPayment: false,
        payment,
        paymentDisplay: toPaymentDisplay(payment)
      });
    } catch (error) {
      this.setData({
        creatingPayment: false,
        paymentError: error instanceof Error ? error.message : '支付单创建失败'
      });
    }
  },

  async submitRefund() {
    if (!this.data.order) {
      this.setData({ refundError: '缺少订单信息' });
      return;
    }

    if (!canRequestRefund(this.data.order)) {
      this.setData({ refundError: '当前订单不可申请退款' });
      return;
    }

    this.setData({ requestingRefund: true, refundError: '' });

    try {
      const response = await requestJson('/orders/refunds', {
        method: 'POST',
        data: buildRefundPayload({
          requestId: createRefundRequestId(this.data.order.orderNo),
          order: this.data.order
        })
      });
      const refund = response.refund;
      const nextOrder = { ...this.data.order, status: 'refund_processing' };

      this.setData({
        requestingRefund: false,
        refund,
        refundDisplay: toRefundDisplay(refund),
        order: nextOrder,
        orderDisplay: toOrderDetailDisplay(nextOrder),
        canRequestRefund: false
      });
    } catch (error) {
      this.setData({
        requestingRefund: false,
        refundError: error instanceof Error ? error.message : '退款申请提交失败'
      });
    }
  }
});
