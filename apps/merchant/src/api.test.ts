import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchMerchantFulfillmentOrders,
  resetMerchantAccessTokenProvider,
  setMerchantAccessTokenProvider,
  submitProductForReview
} from './api';

describe('merchant API auth client', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ orders: [] })
      }))
    );
  });

  afterEach(() => {
    resetMerchantAccessTokenProvider();
    vi.unstubAllGlobals();
  });

  it('adds the configured JWT bearer token to merchant API requests', async () => {
    setMerchantAccessTokenProvider(() => 'merchant-token-001');

    await fetchMerchantFulfillmentOrders('merchant-001');

    expect(fetch).toHaveBeenCalledWith(expect.any(String), {
      headers: { Authorization: 'Bearer merchant-token-001' }
    });
  });

  it('preserves JSON headers while adding Authorization for write requests', async () => {
    setMerchantAccessTokenProvider(() => 'merchant-token-002');

    await submitProductForReview({ productId: 'product-001', actorUserId: 'merchant-user-001' });

    expect(fetch).toHaveBeenCalledWith(expect.any(String), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer merchant-token-002'
      },
      body: JSON.stringify({ actorUserId: 'merchant-user-001' })
    });
  });
});
