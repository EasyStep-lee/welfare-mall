import { describe, expect, it } from 'vitest';
import { buildSettlementCsv } from './settlementExport';

describe('merchant settlement CSV export', () => {
  it('builds a line-level CSV with merchant statement payout evidence and bill details', () => {
    const csv = buildSettlementCsv([
      {
        id: 'statement-001',
        statementNo: 'MSS-20260606-001',
        merchantId: 'merchant-001',
        status: 'paid_offline',
        itemCount: 1,
        grossAmount: 18980,
        refundOffsetAmount: 1000,
        adjustmentAmount: -500,
        netAmount: 17480,
        generatedAt: '2026-06-06T00:00:00.000Z',
        paidAt: '2026-06-07T00:00:00.000Z',
        payoutReference: 'BANK-20260607-001',
        payoutRemark: 'June welfare payout, batch A',
        items: [
          {
            id: 'bill-item-001',
            billItemNo: 'MSBI-ORDER-20260605-001-ORDER-LINE-001',
            merchantId: 'merchant-001',
            orderNo: 'ORDER-20260605-001',
            orderLineId: 'order-line-001',
            productId: 'product-001',
            skuId: 'sku-001',
            source: 'order_paid',
            status: 'paid_offline',
            grossAmount: 18980,
            refundOffsetAmount: 1000,
            adjustmentAmount: -500,
            netAmount: 17480,
            statementId: 'statement-001',
            createdAt: '2026-06-05T00:00:00.000Z',
            updatedAt: '2026-06-06T00:00:00.000Z'
          }
        ]
      }
    ]);

    expect(csv.split('\n')[0]).toBe(
      'statementNo,merchantId,statementStatus,itemCount,statementGrossAmount,statementRefundOffsetAmount,statementAdjustmentAmount,statementNetAmount,generatedAt,paidAt,payoutReference,payoutRemark,billItemNo,orderNo,productId,skuId,billItemStatus,billItemGrossAmount,billItemRefundOffsetAmount,billItemAdjustmentAmount,billItemNetAmount'
    );
    expect(csv).toContain('MSS-20260606-001,merchant-001,paid_offline,1,189.80,10.00,-5.00,174.80');
    expect(csv).toContain('BANK-20260607-001,"June welfare payout, batch A"');
    expect(csv).toContain(
      'MSBI-ORDER-20260605-001-ORDER-LINE-001,ORDER-20260605-001,product-001,sku-001,paid_offline,189.80,10.00,-5.00,174.80'
    );
  });
});
