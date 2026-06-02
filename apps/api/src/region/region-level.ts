export const RegionLevels = {
  Province: 'province',
  City: 'city',
  District: 'district',
  Town: 'town'
} as const;

export type RegionLevel = (typeof RegionLevels)[keyof typeof RegionLevels];

export const RegionLevelCatalog: Array<{ code: RegionLevel; name: string }> = [
  { code: RegionLevels.Province, name: '省' },
  { code: RegionLevels.City, name: '市' },
  { code: RegionLevels.District, name: '区县' },
  { code: RegionLevels.Town, name: '乡镇/街道' }
];
