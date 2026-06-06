import { createRequire } from 'node:module';
import { afterEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const {
  apiUrl,
  orderAmountPreviewUrl,
  orderCancelUrl,
  orderCheckoutUrl,
  orderDetailUrl,
  orderListUrl,
  orderRefundUrl,
  orderPaymentUrl,
  productPoolCatalogUrl,
  productPoolItemDetailUrl,
  requestJson
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
    expect(orderPaymentUrl()).toBe('http://localhost:3000/api/orders/payments');
    expect(orderRefundUrl()).toBe('http://localhost:3000/api/orders/refunds');
    expect(orderCancelUrl('ORDER 001', 'https://api.example.com/api/')).toBe(
      'https://api.example.com/api/orders/ORDER%20001/cancel'
    );
  });

  it('builds buyer-scoped order read URLs', () => {
    expect(orderListUrl('local-user-001')).toBe('http://localhost:3000/api/orders?buyerUserId=local-user-001');
    expect(orderDetailUrl('ORDER 001', 'local user 001', 'https://api.example.com/api/')).toBe(
      'https://api.example.com/api/orders/ORDER%20001?buyerUserId=local%20user%20001'
    );
  });

  describe('requestJson auth headers', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('adds the app global access token as a JWT bearer header', async () => {
      const request = vi.fn((options) => options.success({ statusCode: 200, data: { ok: true } }));
      vi.stubGlobal('getApp', () => ({
        globalData: {
          apiBaseUrl: 'https://api.example.com/api',
          accessToken: 'buyer-token-001'
        }
      }));
      vi.stubGlobal('wx', { request });

      await expect(requestJson('/orders')).resolves.toEqual({ ok: true });

      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          header: { Authorization: 'Bearer buyer-token-001' }
        })
      );
    });

    it('prefers an explicit request token over the app global token', async () => {
      const request = vi.fn((options) => options.success({ statusCode: 200, data: { ok: true } }));
      vi.stubGlobal('getApp', () => ({
        globalData: {
          accessToken: 'buyer-token-global'
        }
      }));
      vi.stubGlobal('wx', { request });

      await expect(requestJson('/orders', { accessToken: 'buyer-token-explicit' })).resolves.toEqual({ ok: true });

      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          header: { Authorization: 'Bearer buyer-token-explicit' }
        })
      );
    });

    it('omits Authorization when no access token is available', async () => {
      const request = vi.fn((options) => options.success({ statusCode: 200, data: { ok: true } }));
      vi.stubGlobal('getApp', () => ({ globalData: {} }));
      vi.stubGlobal('wx', { request });

      await expect(requestJson('/orders')).resolves.toEqual({ ok: true });

      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          header: {}
        })
      );
    });
  });
});
