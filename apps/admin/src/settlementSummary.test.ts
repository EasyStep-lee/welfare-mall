import { describe, expect, it } from 'vitest';
import { summarizeSettlementStatements } from './settlementSummary';

describe('admin settlement summary', () => {
  it('summarizes statement counts, bill items, and money totals', () => {
    const summary = summarizeSettlementStatements([
      {
        id: 'statement-001',
        statementNo: 'MSS-20260606-001',
        merchantId: 'merchant-001',
        status: 'generated',
        itemCount: 2,
        grossAmount: 18980,
        refundOffsetAmount: 1000,
        adjustmentAmount: -500,
        netAmount: 17480,
        generatedAt: '2026-06-06T00:00:00.000Z',
        paidAt: null,
        payoutReference: null,
        payoutRemark: null,
        items: []
      },
      {
        id: 'statement-002',
        statementNo: 'MSS-20260606-002',
        merchantId: 'merchant-002',
        status: 'generated',
        itemCount: 1,
        grossAmount: 5000,
        refundOffsetAmount: 0,
        adjustmentAmount: 200,
        netAmount: 5200,
        generatedAt: '2026-06-06T00:10:00.000Z',
        paidAt: null,
        payoutReference: null,
        payoutRemark: null,
        items: []
      }
    ]);

    expect(summary).toEqual({
      statementCount: 2,
      itemCount: 3,
      grossAmount: 23980,
      refundOffsetAmount: 1000,
      adjustmentAmount: -300,
      netAmount: 22680
    });
  });
});
