import { RegionLevelCatalog } from '../../src/region/region-level';

describe('RegionLevelCatalog', () => {
  it('includes every supported geographic level', () => {
    expect(RegionLevelCatalog.map((level) => level.code)).toEqual(['province', 'city', 'district', 'town']);
  });
});
