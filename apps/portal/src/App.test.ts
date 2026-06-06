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

const detailResponse = {
  id: 'pool-item-local-review',
  productPoolId: 'pool-local-review',
  productId: 'product-local-review',
  skuId: 'sku-local-review-5kg',
  sortOrder: 0,
  displayName: '本地审核五常大米福利装',
  displaySkuCode: 'SKU-LOCAL-REVIEW-5KG',
  displayPriceAmount: 6990,
  displayImageUrl: 'https://img.example.com/local-review/rice-main.jpg',
  product: {
    code: 'P-LOCAL-REVIEW',
    name: '本地审核五常大米福利装',
    origin: { country: '中国', province: '黑龙江', city: '哈尔滨', description: '五常核心产区' },
    brand: { id: 'brand-local', code: 'wuchang', name: '五常香米' },
    category: { id: 'category-grain', code: 'grain', name: '粮油副食' },
    media: [{ type: 'main_image', url: 'https://img.example.com/local-review/rice-main.jpg', sortOrder: 1 }],
    qualifications: [{ type: 'origin_certificate', title: '产地证明', certificateNo: 'CERT-LOCAL-001', fileUrl: null }],
    parameters: [{ groupName: '基础参数', name: '净含量', value: '5kg', valueType: 'text', sortOrder: 1 }],
    detailSections: [{ type: 'text', title: '福利说明', content: '适合企业福利发放', sortOrder: 1 }]
  },
  sku: {
    code: 'SKU-LOCAL-REVIEW-5KG',
    priceAmount: 6990,
    marketPriceAmount: 7990,
    specText: '规格: 5kg'
  }
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

  it('opens a product detail panel from a catalog card', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('/product-pools/items/pool-item-local-review')) {
          return {
            ok: true,
            json: async () => detailResponse
          };
        }

        return {
          ok: true,
          json: async () => catalogResponse
        };
      })
    );

    const wrapper = mount(App);
    await flushPromises();

    await wrapper.get('button[aria-label="查看 本地审核五常大米福利装 详情"]').trigger('click');
    await flushPromises();

    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/product-pools/items/pool-item-local-review');
    expect(wrapper.text()).toContain('P-LOCAL-REVIEW');
    expect(wrapper.text()).toContain('五常香米');
    expect(wrapper.text()).toContain('粮油副食');
    expect(wrapper.text()).toContain('五常核心产区');
    expect(wrapper.text()).toContain('净含量');
    expect(wrapper.text()).toContain('5kg');
    expect(wrapper.text()).toContain('产地证明');
    expect(wrapper.text()).toContain('福利说明');
    expect(wrapper.text()).toContain('适合企业福利发放');
  });
});
