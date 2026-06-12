const { requestJson } = require('../../utils/api');
const { formatMoney } = require('../../utils/format');

Page({
  data: {
    loading: true,
    error: '',
    pools: [],
    items: []
  },

  onLoad() {
    this.loadCatalog();
  },

  async loadCatalog() {
    this.setData({ loading: true, error: '' });

    try {
      const response = await requestJson('/product-pools/catalog');
      const pools = response.productPools || [];
      const items = pools.flatMap((pool) =>
        (pool.items || []).map((item) => ({
          ...item,
          franchiseId: pool.franchiseId || '',
          poolName: pool.name,
          priceText: formatMoney(item.displayPriceAmount)
        }))
      );

      this.setData({ pools, items, loading: false });
    } catch (error) {
      this.setData({
        pools: [],
        items: [],
        loading: false,
        error: error instanceof Error ? error.message : '商品池加载失败'
      });
    }
  },

  openDetail(event) {
    const { itemId, franchiseId } = event.currentTarget.dataset;
    const query = [`itemId=${encodeURIComponent(itemId)}`];
    if (franchiseId) {
      query.push(`franchiseId=${encodeURIComponent(franchiseId)}`);
    }
    wx.navigateTo({ url: `/pages/detail/index?${query.join('&')}` });
  }
});
