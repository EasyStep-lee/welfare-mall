import { flushPromises, mount, VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('localStorage', createStorageMock());
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith('/auth/login')) {
      return response({
        tokenType: 'Bearer',
        accessToken: 'franchise-token',
        expiresIn: 3600,
        sessionId: 'session-franchise-local',
        user: {
          sub: 'user-franchise-local',
          username: 'franchise-local',
          displayName: '本地加盟商操作员',
          subjectType: 'franchise',
          subjectId: 'franchise-local-review',
          permissions: ['franchise:read', 'franchise:write', 'settlement:read']
        }
      });
    }
    if (url.includes('/franchises/franchise-local-review/welfare-cards/issue')) {
      return response({
        idempotentReplay: false,
        account: {
          accountNo: 'WCA-franchise-local-review-buyer-local',
          franchiseId: 'franchise-local-review',
          buyerUserId: 'buyer-local',
          status: 'active',
          balanceAmount: 20000,
          issuedAmount: 20000
        },
        ledgerEntry: {
          ledgerNo: 'WCL-franchise-issue-001',
          requestId: 'FRANCHISE-WELFARE-ISSUE-buyer-local-20000',
          type: 'issue',
          amount: 20000,
          balanceAfter: 20000
        }
      });
    }

    return response({ message: `Unhandled ${init?.method ?? 'GET'} ${url}` }, 404);
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Franchise Vue workbench', () => {
  it('requires franchise login before loading the welfare-card workbench', async () => {
    const wrapper = mount(App);

    expect(wrapper.text()).toContain('加盟商登录');
    expect(wrapper.text()).not.toContain('福利卡发放');

    await setFieldValue(wrapper, '用户名', 'franchise-local');
    await setFieldValue(wrapper, '密码', 'local-dev-password');
    await clickButton(wrapper, '登录加盟商工作台');
    await flushPromises();

    expect(wrapper.text()).toContain('福利卡发放');
    expect(wrapper.text()).toContain('当前加盟商 franchise-local-review');
    expect(wrapper.text()).toContain('本地加盟商操作员');
    expect(wrapper.text()).not.toContain('发卡加盟商ID');
    expect(localStorage.getItem('franchiseAccessToken')).toBe('franchise-token');
  });

  it('issues welfare-card balance as the authenticated franchise subject', async () => {
    const wrapper = mount(App);
    await login(wrapper);

    await setFieldValue(wrapper, '发卡用户ID', 'buyer-local');
    await setFieldValue(wrapper, '发卡金额(分)', '20000');
    await setFieldValue(wrapper, '发卡备注', '加盟商发卡验证');
    await clickButton(wrapper, '发放福利卡');
    await flushPromises();

    const issueCall = fetchMock.mock.calls.find(([input]) =>
      String(input).includes('/franchises/franchise-local-review/welfare-cards/issue')
    );
    expect(issueCall?.[1]).toMatchObject({
      method: 'POST',
      headers: {
        Authorization: 'Bearer franchise-token',
        'Content-Type': 'application/json'
      }
    });
    expect(JSON.parse(String(issueCall?.[1]?.body))).toEqual({
      requestId: 'FRANCHISE-WELFARE-ISSUE-buyer-local-20000',
      buyerUserId: 'buyer-local',
      amount: 20000,
      remark: '加盟商发卡验证'
    });
    expect(wrapper.text()).toContain('buyer-local 福利卡已发放 ¥200.00');
    expect(wrapper.text()).toContain('发卡流水 WCL-franchise-issue-001');
    expect(wrapper.text()).toContain('账户余额 ¥200.00');
    expect(wrapper.text()).toContain('累计发行 ¥200.00');
  });

  it('requires buyer and a positive amount before issuing welfare-card balance', async () => {
    const wrapper = mount(App);
    await login(wrapper);

    await setFieldValue(wrapper, '发卡用户ID', '');
    await setFieldValue(wrapper, '发卡金额(分)', '0');
    await clickButton(wrapper, '发放福利卡');
    await flushPromises();

    const issueCalls = fetchMock.mock.calls.filter(([input, init]) =>
      String(input).includes('/welfare-cards/issue') && init?.method === 'POST'
    );
    expect(issueCalls).toHaveLength(0);
    expect(wrapper.text()).toContain('请填写发卡用户ID和正整数发卡金额');
  });
});

async function login(wrapper: VueWrapper) {
  await setFieldValue(wrapper, '用户名', 'franchise-local');
  await setFieldValue(wrapper, '密码', 'local-dev-password');
  await clickButton(wrapper, '登录加盟商工作台');
  await flushPromises();
}

async function setFieldValue(wrapper: VueWrapper, label: string, value: string) {
  const labels = wrapper.findAll('label');
  const target = labels.find((candidate) => candidate.text().includes(label));
  expect(target, `Missing label ${label}`).toBeTruthy();
  const input = target?.find('input');
  expect(input?.exists(), `Missing input for ${label}`).toBe(true);
  await input?.setValue(value);
}

async function clickButton(wrapper: VueWrapper, text: string) {
  const button = wrapper.findAll('button').find((candidate) => candidate.text().includes(text));
  expect(button, `Missing button ${text}`).toBeTruthy();
  await button?.trigger('click');
}

function response(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
  };
}

function createStorageMock() {
  const values = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      values.delete(key);
    }),
    clear: vi.fn(() => {
      values.clear();
    })
  };
}
