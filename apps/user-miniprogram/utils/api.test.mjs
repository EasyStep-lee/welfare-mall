import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { apiUrl, productPoolCatalogUrl, productPoolItemDetailUrl } = require('./api.js');

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
});
