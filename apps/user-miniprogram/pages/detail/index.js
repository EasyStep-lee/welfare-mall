const { requestJson } = require('../../utils/api');
const { formatMoney, joinOrigin } = require('../../utils/format');

Page({
  data: {
    loading: true,
    error: '',
    detail: null,
    priceText: '',
    originText: ''
  },

  onLoad(options) {
    this.loadDetail(options.itemId);
  },

  async loadDetail(itemId) {
    if (!itemId) {
      this.setData({ loading: false, error: '缺少商品参数' });
      return;
    }

    this.setData({ loading: true, error: '' });

    try {
      const detail = await requestJson(`/product-pools/items/${decodeURIComponent(itemId)}`);
      this.setData({
        detail,
        priceText: formatMoney(detail.displayPriceAmount),
        originText: joinOrigin(detail.product?.origin),
        loading: false
      });
    } catch (error) {
      this.setData({
        detail: null,
        loading: false,
        error: error instanceof Error ? error.message : '商品详情加载失败'
      });
    }
  }
});
