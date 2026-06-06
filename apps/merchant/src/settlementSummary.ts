import { MerchantSettlementStatement } from './api';

export type SettlementSummary = {
  statementCount: number;
  itemCount: number;
  grossAmount: number;
  refundOffsetAmount: number;
  adjustmentAmount: number;
  netAmount: number;
};

export function summarizeSettlementStatements(statements: MerchantSettlementStatement[]): SettlementSummary {
  return statements.reduce<SettlementSummary>(
    (summary, statement) => ({
      statementCount: summary.statementCount + 1,
      itemCount: summary.itemCount + statement.itemCount,
      grossAmount: summary.grossAmount + statement.grossAmount,
      refundOffsetAmount: summary.refundOffsetAmount + statement.refundOffsetAmount,
      adjustmentAmount: summary.adjustmentAmount + statement.adjustmentAmount,
      netAmount: summary.netAmount + statement.netAmount
    }),
    {
      statementCount: 0,
      itemCount: 0,
      grossAmount: 0,
      refundOffsetAmount: 0,
      adjustmentAmount: 0,
      netAmount: 0
    }
  );
}
