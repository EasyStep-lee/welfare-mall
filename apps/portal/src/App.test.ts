import { flushPromises, mount } from '@vue/test-utils';
import App from './App.vue';

const catalogResponse = {
  productPools: [
    {
      id: 'pool-local-review',
      code: 'FRANCHISE-franchise-local-review-DEFAULT',
      name: '默认商品池',
      status: 'active',
      franchiseId: 'franchise-local-review',
      items: [
        {
          id: 'pool-item-local-review',
          productId: 'product-local-review',
          skuId: 'sku-local-review-5kg',
          sortOrder: 0,
          displayName: '本地审核五常大米福利装',
          displaySkuCode: 'SKU-LOCAL-REVIEW-5KG',
          displayPriceAmount: 6990,
          displayImageUrl: 'https://img.example.com/local-review/rice-main.jpg'
        }
      ]
    }
  ]
};

describe('Portal product pool catalog', () => {
  it('loads and renders product pool item snapshots', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => catalogResponse
      }))
    );

    const wrapper = mount(App);
    await flushPromises();

    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/product-pools/catalog');
    expect(wrapper.text()).toContain('默认商品池');
    expect(wrapper.text()).toContain('本地审核五常大米福利装');
    expect(wrapper.text()).toContain('SKU-LOCAL-REVIEW-5KG');
    expect(wrapper.text()).toContain('¥69.90');
  });

  it('renders an empty state when no pool items exist', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ productPools: [{ ...catalogResponse.productPools[0], items: [] }] })
      }))
    );

    const wrapper = mount(App);
    await flushPromises();

    expect(wrapper.text()).toContain('暂无可展示商品');
  });
});
