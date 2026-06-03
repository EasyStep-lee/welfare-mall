const { requestJson } = require('../../utils/api');
const { toOrderDetailDisplay } = require('../../utils/order');
const { buildPaymentPayload, createPaymentRequestId, toPaymentDisplay } = require('../../utils/payment');

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
    paymentError: ''
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
        paymentError: ''
      });
    } catch (error) {
      this.setData({
        order: null,
        orderDisplay: null,
        loading: false,
        error: error instanceof Error ? error.message : '订单详情加载失败'
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
  }
});
