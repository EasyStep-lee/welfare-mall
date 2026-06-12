import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  bindPortalWelfareCard,
  createPortalPayment,
  fetchPortalWelfareCardAccounts,
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

  it('fetches the authenticated buyer welfare-card accounts for one sales franchise', async () => {
    setPortalAccessTokenProvider(() => 'buyer-token-001');

    await fetchPortalWelfareCardAccounts('franchise-local-review');

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/franchises/franchise-local-review/welfare-card-accounts/me',
      { headers: { Authorization: 'Bearer buyer-token-001' } }
    );
  });

  it('binds an entity welfare card without sending a buyer ID from the Portal client', async () => {
    setPortalAccessTokenProvider(() => 'buyer-token-001');

    await bindPortalWelfareCard({
      franchiseId: 'franchise-local-review',
      requestId: 'bind-request-001',
      cardNo: 'WFC-batch-request-001-0001',
      bindCode: 'BIND-batch-request-001-0001'
    });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/franchises/franchise-local-review/welfare-cards/bind',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer buyer-token-001' },
        body: JSON.stringify({
          requestId: 'bind-request-001',
          cardNo: 'WFC-batch-request-001-0001',
          bindCode: 'BIND-batch-request-001-0001'
        })
      })
    );
  });

  it('sends the selected welfare-card account when creating a mixed payment', async () => {
    setPortalAccessTokenProvider(() => 'buyer-token-001');

    await createPortalPayment({
      requestId: 'portal-payment-001',
      orderNo: 'ORDER-20260607-PORTAL',
      channel: 'wechat',
      totalAmount: 6990,
      welfareCardPayableAmount: 1000,
      cashPayableAmount: 5990,
      welfareCardAccountId: 'wca-001'
    });

    const paymentCall = vi.mocked(fetch).mock.calls.find(([input]) => String(input).endsWith('/orders/payments'));
    expect(paymentCall).toBeTruthy();
    expect(JSON.parse(String(paymentCall?.[1]?.body))).toMatchObject({
      welfareCardAccountId: 'wca-001'
    });
  });
});
