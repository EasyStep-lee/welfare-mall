import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { formatMoney, joinOrigin } = require('./format.js');

describe('user mini-program format helpers', () => {
  it('formats fen amounts as RMB', () => {
    expect(formatMoney(6990)).toBe('¥69.90');
  });

  it('joins origin fields for display', () => {
    expect(joinOrigin({ country: '中国', province: '黑龙江', city: '哈尔滨' })).toBe('中国 / 黑龙江 / 哈尔滨');
  });
});
