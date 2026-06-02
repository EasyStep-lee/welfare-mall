import { buildMerchantSummary } from '../../src/merchant/merchant-summary';

describe('buildMerchantSummary', () => {
  it('returns the merchant business identity and business scope labels', () => {
    const summary = buildMerchantSummary({
      id: 'merchant-001',
      code: 'M-HZ-001',
      name: '西湖福利供应商',
      franchiseId: 'franchise-001',
      businessScopes: [
        { code: 'food', label: '食品' },
        { code: 'daily_goods', label: '日用品' }
      ],
      status: 'active'
    });

    expect(summary).toEqual({
      id: 'merchant-001',
      code: 'M-HZ-001',
      name: '西湖福利供应商',
      franchiseId: 'franchise-001',
      businessScopeLabels: ['食品', '日用品'],
      status: 'active'
    });
  });
});
