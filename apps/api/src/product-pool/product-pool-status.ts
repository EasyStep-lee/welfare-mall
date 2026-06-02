export const ProductPoolStatuses = {
  Draft: 'draft',
  Active: 'active',
  Paused: 'paused',
  Archived: 'archived'
} as const;

export type ProductPoolStatus = (typeof ProductPoolStatuses)[keyof typeof ProductPoolStatuses];

export const ProductPoolStatusCatalog: Array<{ code: ProductPoolStatus; name: string }> = [
  { code: ProductPoolStatuses.Draft, name: '草稿' },
  { code: ProductPoolStatuses.Active, name: '启用' },
  { code: ProductPoolStatuses.Paused, name: '暂停' },
  { code: ProductPoolStatuses.Archived, name: '归档' }
];
