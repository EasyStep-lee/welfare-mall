export const MerchantSettlementBillSources = {
  OrderPaid: 'order_paid'
} as const;

export const MerchantSettlementBillStatuses = {
  PendingSettlement: 'pending_settlement',
  StatementGenerated: 'statement_generated',
  PaidOffline: 'paid_offline',
  Reversed: 'reversed'
} as const;

export const MerchantSettlementStatementStatuses = {
  Generated: 'generated',
  PaidOffline: 'paid_offline'
} as const;

export const FranchiseSalesLedgerSources = {
  OrderPaid: 'order_paid',
  RefundSucceeded: 'refund_succeeded'
} as const;

export const FranchiseSalesLedgerStatuses = {
  Posted: 'posted'
} as const;

export type MerchantSettlementBillSource =
  (typeof MerchantSettlementBillSources)[keyof typeof MerchantSettlementBillSources];
export type MerchantSettlementBillStatus =
  (typeof MerchantSettlementBillStatuses)[keyof typeof MerchantSettlementBillStatuses];
export type MerchantSettlementStatementStatus =
  (typeof MerchantSettlementStatementStatuses)[keyof typeof MerchantSettlementStatementStatuses];
export type FranchiseSalesLedgerSource =
  (typeof FranchiseSalesLedgerSources)[keyof typeof FranchiseSalesLedgerSources];
export type FranchiseSalesLedgerStatus =
  (typeof FranchiseSalesLedgerStatuses)[keyof typeof FranchiseSalesLedgerStatuses];
