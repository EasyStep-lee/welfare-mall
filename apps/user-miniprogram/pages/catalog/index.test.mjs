import { createRequire } from 'node:module';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);

function mountPage() {
  let pageDefinition;
  const requests = [];
  const navigations = [];

  global.Page = vi.fn((definition) => {
    pageDefinition = definition;
  });
  global.getApp = vi.fn(() => ({ globalData: { apiBaseUrl: 'http://localhost:3000/api' } }));
  global.wx = {
    request: vi.fn((request) => {
      requests.push(request);
      request.success({
        statusCode: 200,
        data: {
          productPools: [
            {
              id: 'pool-local-review',
              name: '本地福利商品池',
              franchiseId: 'franchise-local-review',
              items: [
                {
                  id: 'pool-item-001',
                  displayName: 'Local Rice',
                  displaySkuCode: 'SKU-RICE-5KG',
                  displayPriceAmount: 6990,
                  displayImageUrl: 'https://cdn.example.com/rice.jpg'
                }
              ]
            }
          ]
        }
      });
    }),
    navigateTo: vi.fn((navigation) => navigations.push(navigation))
  };

  delete require.cache[require.resolve('./index.js')];
  require('./index.js');

  const page = {
    ...pageDefinition,
    data: { ...pageDefinition.data },
    setData(update) {
      this.data = { ...this.data, ...update };
    }
  };

  return { page, requests, navigations };
}

describe('user mini-program catalog page', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('carries the product pool sales franchise into product detail navigation', async () => {
    const { page, navigations } = mountPage();

    await page.loadCatalog();
    page.openDetail({ currentTarget: { dataset: { itemId: 'pool-item-001', franchiseId: 'franchise-local-review' } } });

    expect(page.data.items[0]).toMatchObject({
      id: 'pool-item-001',
      franchiseId: 'franchise-local-review'
    });
    expect(navigations[0]).toEqual({
      url: '/pages/detail/index?itemId=pool-item-001&franchiseId=franchise-local-review'
    });
  });
});
