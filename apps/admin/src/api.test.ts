import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchAdminOrders,
  fetchReviewQueue,
  resetAdminAccessTokenProvider,
  setAdminAccessTokenProvider
} from './api';

describe('admin API auth client', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ status: 'pending_review', items: [], orders: [] })
      }))
    );
  });

  afterEach(() => {
    resetAdminAccessTokenProvider();
    vi.unstubAllGlobals();
  });

  it('adds the configured JWT bearer token to admin API requests', async () => {
    setAdminAccessTokenProvider(() => 'admin-token-001');

    await fetchReviewQueue('pending_review');

    expect(fetch).toHaveBeenCalledWith(expect.any(URL), {
      headers: { Authorization: 'Bearer admin-token-001' }
    });
  });

  it('omits Authorization when no admin token is configured', async () => {
    setAdminAccessTokenProvider(() => null);

    await fetchAdminOrders();

    expect(fetch).toHaveBeenCalledWith(expect.any(String));
  });
});
