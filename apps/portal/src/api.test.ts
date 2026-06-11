import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchPortalOrders,
  resetPortalAccessTokenProvider,
  setPortalAccessTokenProvider
} from './api';

describe('portal API auth client', () => {
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
    resetPortalAccessTokenProvider();
    vi.unstubAllGlobals();
  });

  it('adds the configured JWT bearer token to portal API requests', async () => {
    setPortalAccessTokenProvider(() => 'buyer-token-001');

    await fetchPortalOrders('buyer-auth-999');

    expect(fetch).toHaveBeenCalledWith(expect.any(String), {
      headers: { Authorization: 'Bearer buyer-token-001' }
    });
  });
});
