import { buildFranchiseSummary } from '../../src/franchise/franchise-summary';

describe('buildFranchiseSummary', () => {
  it('returns the active franchise business identity', () => {
    const summary = buildFranchiseSummary({
      id: 'franchise-001',
      code: 'F-HZ-001',
      name: '杭州城市加盟商',
      regionCode: 'CN-ZJ-HZ',
      status: 'active'
    });

    expect(summary).toEqual({
      id: 'franchise-001',
      code: 'F-HZ-001',
      name: '杭州城市加盟商',
      regionCode: 'CN-ZJ-HZ',
      status: 'active'
    });
  });
});
