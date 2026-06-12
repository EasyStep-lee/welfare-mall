export const WelfareCardAccountStatuses = {
  Active: 'active',
  Frozen: 'frozen'
} as const;

export const WelfareCardBatchStatuses = {
  Active: 'active'
} as const;

export const WelfareCardStatuses = {
  Unbound: 'unbound',
  Bound: 'bound'
} as const;

export const WelfareCardLedgerEntryTypes = {
  Issue: 'issue',
  Bind: 'bind',
  Payment: 'payment',
  Refund: 'refund'
} as const;

export type WelfareCardAccountStatus =
  (typeof WelfareCardAccountStatuses)[keyof typeof WelfareCardAccountStatuses];

export type WelfareCardBatchStatus =
  (typeof WelfareCardBatchStatuses)[keyof typeof WelfareCardBatchStatuses];

export type WelfareCardStatus = (typeof WelfareCardStatuses)[keyof typeof WelfareCardStatuses];

export type WelfareCardLedgerEntryType =
  (typeof WelfareCardLedgerEntryTypes)[keyof typeof WelfareCardLedgerEntryTypes];
