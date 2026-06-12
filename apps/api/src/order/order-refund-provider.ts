import { createSign, randomUUID } from 'crypto';

export type RefundOnlineChannel = 'wechat' | 'alipay';

export type RefundProviderRequest = {
  refundNo: string;
  paymentNo: string;
  providerPaymentNo: string | null;
  channel: RefundOnlineChannel;
  onlineRefundAmount: number;
  originalOnlineAmount: number;
  reason: string;
  requestedAt: Date;
};

export type RefundProviderResult = {
  skipped: boolean;
  providerRefundNo: string | null;
  payload: unknown;
};

export interface RefundChannelProvider {
  createRefund(input: RefundProviderRequest): Promise<RefundProviderResult>;
}

export const REFUND_CHANNEL_PROVIDER = Symbol('REFUND_CHANNEL_PROVIDER');

export type RefundProviderEnv = Partial<Record<string, string | undefined>>;

export type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<{
  ok: boolean;
  status: number;
  text(): Promise<string>;
}>;

export class RefundProviderConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RefundProviderConfigurationError';
  }
}

export class RefundProviderRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RefundProviderRequestError';
  }
}

export class NoopRefundChannelProvider implements RefundChannelProvider {
  async createRefund(input: RefundProviderRequest): Promise<RefundProviderResult> {
    assertOnlineRefundChannel(input.channel);
    return { skipped: true, providerRefundNo: null, payload: null };
  }
}

export type WechatRefundProviderConfig = {
  apiBaseUrl: string;
  mchId: string;
  merchantSerialNo: string;
  privateKey: string;
  notifyUrl: string;
};

export class WechatRefundChannelProvider implements RefundChannelProvider {
  constructor(
    private readonly config: WechatRefundProviderConfig,
    private readonly fetchFn: FetchLike = defaultFetch
  ) {}

  async createRefund(input: RefundProviderRequest): Promise<RefundProviderResult> {
    assertOnlineRefundChannel(input.channel);
    assertPositiveAmount(input.onlineRefundAmount, 'onlineRefundAmount');
    assertPositiveAmount(input.originalOnlineAmount, 'originalOnlineAmount');

    const path = '/v3/refund/domestic/refunds';
    const url = `${trimTrailingSlash(this.config.apiBaseUrl)}${path}`;
    const body = JSON.stringify({
      ...wechatPaymentReference(input),
      out_refund_no: input.refundNo,
      reason: input.reason,
      notify_url: this.config.notifyUrl,
      amount: {
        refund: input.onlineRefundAmount,
        total: input.originalOnlineAmount,
        currency: 'CNY'
      }
    });
    const timestamp = Math.floor(input.requestedAt.getTime() / 1000).toString();
    const nonce = randomUUID().replace(/-/g, '');
    const signature = signWechatRequest({
      method: 'POST',
      path,
      timestamp,
      nonce,
      body,
      privateKey: this.config.privateKey
    });

    const payload = await postJson(url, body, {
      Authorization: `WECHATPAY2-SHA256-RSA2048 ${[
        `mchid="${this.config.mchId}"`,
        `nonce_str="${nonce}"`,
        `timestamp="${timestamp}"`,
        `serial_no="${this.config.merchantSerialNo}"`,
        `signature="${signature}"`
      ].join(',')}`,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }, this.fetchFn);

    const providerRefundNo = readString(payload, ['refund_id']) ?? readString(payload, ['out_refund_no']) ?? input.refundNo;
    return { skipped: false, providerRefundNo, payload };
  }
}

export type AlipayRefundProviderConfig = {
  gatewayUrl: string;
  appId: string;
  privateKey: string;
};

export class AlipayRefundChannelProvider implements RefundChannelProvider {
  constructor(
    private readonly config: AlipayRefundProviderConfig,
    private readonly fetchFn: FetchLike = defaultFetch
  ) {}

  async createRefund(input: RefundProviderRequest): Promise<RefundProviderResult> {
    assertOnlineRefundChannel(input.channel);
    assertPositiveAmount(input.onlineRefundAmount, 'onlineRefundAmount');

    const params: Record<string, string> = {
      app_id: this.config.appId,
      method: 'alipay.trade.refund',
      charset: 'utf-8',
      sign_type: 'RSA2',
      timestamp: formatAlipayTimestamp(input.requestedAt),
      version: '1.0',
      biz_content: JSON.stringify({
        ...alipayPaymentReference(input),
        out_request_no: input.refundNo,
        refund_amount: centsToYuan(input.onlineRefundAmount),
        refund_reason: input.reason
      })
    };
    params.sign = signAlipayParams(params, this.config.privateKey);

    const body = new URLSearchParams(params).toString();
    const payload = await postJson(this.config.gatewayUrl, body, {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
    }, this.fetchFn);
    const response = isRecord(payload) ? payload.alipay_trade_refund_response : null;
    const providerRefundNo =
      readString(response, ['trade_no']) ??
      readString(response, ['out_trade_no']) ??
      input.providerPaymentNo ??
      input.refundNo;

    return { skipped: false, providerRefundNo, payload };
  }
}

export function createRefundChannelProviderFromEnv(env: RefundProviderEnv = process.env): RefundChannelProvider {
  const mode = normalizeMode(env.REFUND_CHANNEL_PROVIDER_MODE);
  if (mode !== 'real') {
    return new NoopRefundChannelProvider();
  }

  const wechatProvider = createWechatProviderFromEnv(env);
  const alipayProvider = createAlipayProviderFromEnv(env);
  return {
    async createRefund(input: RefundProviderRequest): Promise<RefundProviderResult> {
      assertOnlineRefundChannel(input.channel);
      if (input.channel === 'wechat') {
        return wechatProvider.createRefund(input);
      }
      return alipayProvider.createRefund(input);
    }
  };
}

function createWechatProviderFromEnv(env: RefundProviderEnv): WechatRefundChannelProvider {
  return new WechatRefundChannelProvider({
    apiBaseUrl: env.WECHAT_PAY_API_BASE_URL?.trim() || 'https://api.mch.weixin.qq.com',
    mchId: requiredEnv(env, 'WECHAT_PAY_MCH_ID'),
    merchantSerialNo: requiredEnv(env, 'WECHAT_PAY_MERCHANT_SERIAL_NO'),
    privateKey: normalizePrivateKey(requiredEnv(env, 'WECHAT_PAY_PRIVATE_KEY')),
    notifyUrl: requiredEnv(env, 'WECHAT_PAY_REFUND_NOTIFY_URL')
  });
}

function createAlipayProviderFromEnv(env: RefundProviderEnv): AlipayRefundChannelProvider {
  return new AlipayRefundChannelProvider({
    gatewayUrl: env.ALIPAY_GATEWAY_URL?.trim() || 'https://openapi.alipay.com/gateway.do',
    appId: requiredEnv(env, 'ALIPAY_APP_ID'),
    privateKey: normalizePrivateKey(requiredEnv(env, 'ALIPAY_PRIVATE_KEY'))
  });
}

function wechatPaymentReference(input: RefundProviderRequest): { transaction_id: string } | { out_trade_no: string } {
  return input.providerPaymentNo ? { transaction_id: input.providerPaymentNo } : { out_trade_no: input.paymentNo };
}

function alipayPaymentReference(input: RefundProviderRequest): { trade_no: string } | { out_trade_no: string } {
  return input.providerPaymentNo ? { trade_no: input.providerPaymentNo } : { out_trade_no: input.paymentNo };
}

function normalizeMode(value: string | undefined): 'local' | 'real' {
  return value?.trim().toLowerCase() === 'real' ? 'real' : 'local';
}

function requiredEnv(env: RefundProviderEnv, key: string): string {
  const value = env[key]?.trim();
  if (!value) {
    throw new RefundProviderConfigurationError(`${key} is required when REFUND_CHANNEL_PROVIDER_MODE=real.`);
  }
  return value;
}

function normalizePrivateKey(value: string): string {
  return value.replace(/\\n/g, '\n');
}

function assertOnlineRefundChannel(channel: string): asserts channel is RefundOnlineChannel {
  if (channel !== 'wechat' && channel !== 'alipay') {
    throw new RefundProviderConfigurationError('refund channel must be wechat or alipay.');
  }
}

function assertPositiveAmount(value: number, fieldName: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RefundProviderRequestError(`${fieldName} must be a positive integer.`);
  }
}

function signWechatRequest(input: {
  method: string;
  path: string;
  timestamp: string;
  nonce: string;
  body: string;
  privateKey: string;
}): string {
  const message = `${input.method}\n${input.path}\n${input.timestamp}\n${input.nonce}\n${input.body}\n`;
  return signText(message, input.privateKey);
}

function signAlipayParams(params: Record<string, string>, privateKey: string): string {
  const content = Object.keys(params)
    .filter((key) => key !== 'sign')
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return signText(content, privateKey);
}

function signText(content: string, privateKey: string): string {
  const signer = createSign('RSA-SHA256');
  signer.update(content);
  signer.end();
  return signer.sign(privateKey, 'base64');
}

async function postJson(
  url: string,
  body: string,
  headers: Record<string, string>,
  fetchFn: FetchLike
): Promise<unknown> {
  const response = await fetchFn(url, {
    method: 'POST',
    headers,
    body
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new RefundProviderRequestError(`Refund provider request failed with HTTP ${response.status}.`);
  }
  return payload;
}

async function defaultFetch(url: string, init: { method: string; headers: Record<string, string>; body: string }) {
  const response = await fetch(url, init);
  return {
    ok: response.ok,
    status: response.status,
    text: () => response.text()
  };
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/g, '');
}

function centsToYuan(amount: number): string {
  return (amount / 100).toFixed(2);
}

function formatAlipayTimestamp(value: Date): string {
  const pad = (part: number) => part.toString().padStart(2, '0');
  return [
    value.getFullYear(),
    '-',
    pad(value.getMonth() + 1),
    '-',
    pad(value.getDate()),
    ' ',
    pad(value.getHours()),
    ':',
    pad(value.getMinutes()),
    ':',
    pad(value.getSeconds())
  ].join('');
}

function readString(value: unknown, path: string[]): string | null {
  let current = value;
  for (const segment of path) {
    if (!isRecord(current)) {
      return null;
    }
    current = current[segment];
  }
  return typeof current === 'string' && current.trim().length > 0 ? current : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
