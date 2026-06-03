import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const {
  apiUrl,
  orderAmountPreviewUrl,
  orderCheckoutUrl,
  orderDetailUrl,
  orderListUrl,
  productPoolCatalogUrl,
  productPoolItemDetailUrl
} = require('./api.js');

describe('user mini-program API helpers', () => {
  it('builds catalog URLs from the default API base', () => {
    expect(apiUrl('/product-pools/catalog')).toBe('http://localhost:3000/api/product-pools/catalog');
    expect(productPoolCatalogUrl()).toBe('http://localhost:3000/api/product-pools/catalog');
  });

  it('builds encoded product pool item detail URLs', () => {
    expect(productPoolItemDetailUrl('pool item 001', 'https://api.example.com/api/')).toBe(
      'https://api.example.com/api/product-pools/items/pool%20item%20001'
    );
  });

  it('builds order checkout URLs', () => {
    expect(orderAmountPreviewUrl('https://api.example.com/api/')).toBe(
      'https://api.example.com/api/orders/amount-preview'
    );
    expect(orderCheckoutUrl()).toBe('http://localhost:3000/api/orders');
  });

  it('builds buyer-scoped order read URLs', () => {
    expect(orderListUrl('local-user-001')).toBe('http://localhost:3000/api/orders?buyerUserId=local-user-001');
    expect(orderDetailUrl('ORDER 001', 'local user 001', 'https://api.example.com/api/')).toBe(
      'https://api.example.com/api/orders/ORDER%20001?buyerUserId=local%20user%20001'
    );
  });
});
