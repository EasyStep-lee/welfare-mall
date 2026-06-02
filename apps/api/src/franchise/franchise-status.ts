export const FranchiseStatuses = {
  Active: 'active',
  Suspended: 'suspended',
  Archived: 'archived'
} as const;

export type FranchiseStatus = (typeof FranchiseStatuses)[keyof typeof FranchiseStatuses];

export const FranchiseStatusCatalog: Array<{ code: FranchiseStatus; name: string }> = [
  { code: FranchiseStatuses.Active, name: '正常' },
  { code: FranchiseStatuses.Suspended, name: '暂停' },
  { code: FranchiseStatuses.Archived, name: '归档' }
];
