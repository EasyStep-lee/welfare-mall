const { requestJson } = require('../../utils/api');
const { toOrderSummaryDisplay } = require('../../utils/order');

const LOCAL_BUYER_USER_ID = 'local-user-001';

Page({
  data: {
    loading: true,
    error: '',
    orders: [],
    orderDisplays: []
  },

  onLoad() {
    this.loadOrders();
  },

  async loadOrders() {
    this.setData({ loading: true, error: '' });

    try {
      const response = await requestJson(`/orders?buyerUserId=${encodeURIComponent(LOCAL_BUYER_USER_ID)}`);
      const orders = response.orders || [];

      this.setData({
        orders,
        orderDisplays: orders.map(toOrderSummaryDisplay),
        loading: false
      });
    } catch (error) {
      this.setData({
        orders: [],
        orderDisplays: [],
        loading: false,
        error: error instanceof Error ? error.message : '订单加载失败'
      });
    }
  },

  openOrderDetail(event) {
    const { orderNo } = event.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/order-detail/index?orderNo=${encodeURIComponent(orderNo)}` });
  }
});
