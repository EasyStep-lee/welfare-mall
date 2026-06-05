export const MerchantSettlementBillSources = {
  OrderPaid: 'order_paid'
} as const;

export const MerchantSettlementBillStatuses = {
  PendingSettlement: 'pending_settlement',
  StatementGenerated: 'statement_generated',
  PaidOffline: 'paid_offline',
  Reversed: 'reversed'
} as const;

export type MerchantSettlementBillSource =
  (typeof MerchantSettlementBillSources)[keyof typeof MerchantSettlementBillSources];
export type MerchantSettlementBillStatus =
  (typeof MerchantSettlementBillStatuses)[keyof typeof MerchantSettlementBillStatuses];
