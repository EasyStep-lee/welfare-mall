import { evaluateDataScope } from '../../src/iam/data-scope';

describe('evaluateDataScope', () => {
  it('allows platform scope to access every target', () => {
    expect(evaluateDataScope({ scope: { type: 'platform' }, target: { merchantId: 'm-1' } })).toEqual({ allowed: true });
  });

  it('allows merchant scope only for its merchant id', () => {
    expect(evaluateDataScope({ scope: { type: 'merchant', merchantId: 'm-1' }, target: { merchantId: 'm-1' } })).toEqual({
      allowed: true
    });
    expect(evaluateDataScope({ scope: { type: 'merchant', merchantId: 'm-1' }, target: { merchantId: 'm-2' } })).toEqual({
      allowed: false,
      reason: 'merchant scope mismatch'
    });
  });
});

