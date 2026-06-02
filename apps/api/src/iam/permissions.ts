export const PermissionCodes = {
  ProductRead: 'product:read',
  ProductWrite: 'product:write',
  ProductAudit: 'product:audit',
  MerchantRead: 'merchant:read',
  MerchantWrite: 'merchant:write',
  FranchiseRead: 'franchise:read',
  FranchiseWrite: 'franchise:write',
  SettlementRead: 'settlement:read',
  SettlementAdjust: 'settlement:adjust',
  AuditRead: 'audit:read'
} as const;

export type PermissionCode = (typeof PermissionCodes)[keyof typeof PermissionCodes];

export const PermissionCatalog: Array<{ code: PermissionCode; name: string; risk: 'low' | 'medium' | 'high' }> = [
  { code: PermissionCodes.ProductRead, name: '商品查看', risk: 'low' },
  { code: PermissionCodes.ProductWrite, name: '商品编辑', risk: 'medium' },
  { code: PermissionCodes.ProductAudit, name: '商品审核', risk: 'high' },
  { code: PermissionCodes.MerchantRead, name: '商户查看', risk: 'low' },
  { code: PermissionCodes.MerchantWrite, name: '商户编辑', risk: 'high' },
  { code: PermissionCodes.FranchiseRead, name: '加盟商查看', risk: 'low' },
  { code: PermissionCodes.FranchiseWrite, name: '加盟商编辑', risk: 'high' },
  { code: PermissionCodes.SettlementRead, name: '结算查看', risk: 'medium' },
  { code: PermissionCodes.SettlementAdjust, name: '结算调整', risk: 'high' },
  { code: PermissionCodes.AuditRead, name: '审计查看', risk: 'medium' }
];

