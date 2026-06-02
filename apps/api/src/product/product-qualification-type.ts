export const ProductQualificationTypes = {
  FoodLicense: 'food_license',
  BrandAuthorization: 'brand_authorization',
  OriginCertificate: 'origin_certificate',
  InspectionReport: 'inspection_report',
  ServiceLicense: 'service_license'
} as const;

export type ProductQualificationType = (typeof ProductQualificationTypes)[keyof typeof ProductQualificationTypes];

export const ProductQualificationTypeCatalog: Array<{ code: ProductQualificationType; name: string }> = [
  { code: ProductQualificationTypes.FoodLicense, name: '食品经营许可' },
  { code: ProductQualificationTypes.BrandAuthorization, name: '品牌授权' },
  { code: ProductQualificationTypes.OriginCertificate, name: '产地证明' },
  { code: ProductQualificationTypes.InspectionReport, name: '检测报告' },
  { code: ProductQualificationTypes.ServiceLicense, name: '服务资质' }
];
