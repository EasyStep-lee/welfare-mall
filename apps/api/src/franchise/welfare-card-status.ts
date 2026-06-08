export const WelfareCardAccountStatuses = {
  Active: 'active',
  Frozen: 'frozen'
} as const;

export const WelfareCardLedgerEntryTypes = {
  Issue: 'issue',
  Payment: 'payment',
  Refund: 'refund'
} as const;

export type WelfareCardAccountStatus =
  (typeof WelfareCardAccountStatuses)[keyof typeof WelfareCardAccountStatuses];

export type WelfareCardLedgerEntryType =
  (typeof WelfareCardLedgerEntryTypes)[keyof typeof WelfareCardLedgerEntryTypes];
