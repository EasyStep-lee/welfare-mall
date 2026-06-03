const { requestJson } = require('../../utils/api');
const { toOrderDetailDisplay } = require('../../utils/order');

const LOCAL_BUYER_USER_ID = 'local-user-001';

Page({
  data: {
    loading: true,
    error: '',
    order: null,
    orderDisplay: null
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
        loading: false
      });
    } catch (error) {
      this.setData({
        order: null,
        orderDisplay: null,
        loading: false,
        error: error instanceof Error ? error.message : '订单详情加载失败'
      });
    }
  }
});
