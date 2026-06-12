import { generateKeyPairSync } from 'crypto';
import {
  AlipayRefundChannelProvider,
  createRefundChannelProviderFromEnv,
  NoopRefundChannelProvider,
  RefundProviderConfigurationError,
  WechatRefundChannelProvider
} from '../../src/order/order-refund-provider';

const refundRequest = {
  refundNo: 'REF-20260612-001',
  paymentNo: 'PAY-20260612-001',
  providerPaymentNo: 'provider-pay-001',
  channel: 'wechat' as const,
  onlineRefundAmount: 5990,
  originalOnlineAmount: 5990,
  reason: 'after_sale',
  requestedAt: new Date('2026-06-12T12:00:00.000Z')
};

function createPrivateKey(): string {
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  return privateKey.export({ format: 'pem', type: 'pkcs8' }).toString();
}

function createFetchResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    text: jest.fn().mockResolvedValue(JSON.stringify(body))
  };
}

describe('Refund channel providers', () => {
  it('sends a signed WeChat Pay V3 refund request with online amount only', async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      createFetchResponse({
        refund_id: 'wx-refund-001',
        out_refund_no: refundRequest.refundNo,
        status: 'PROCESSING'
      })
    );
    const provider = new WechatRefundChannelProvider(
      {
        apiBaseUrl: 'https://wechat-pay.example.test',
        mchId: '1900000109',
        merchantSerialNo: 'SERIAL-001',
        privateKey: createPrivateKey(),
        notifyUrl: 'https://api.example.com/api/orders/refunds/callbacks'
      },
      fetchMock
    );

    const result = await provider.createRefund(refundRequest);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://wechat-pay.example.test/v3/refund/domestic/refunds');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toEqual(expect.stringContaining('WECHATPAY2-SHA256-RSA2048'));
    expect(init.headers.Authorization).toEqual(expect.stringContaining('mchid="1900000109"'));
    expect(JSON.parse(init.body)).toEqual({
      transaction_id: refundRequest.providerPaymentNo,
      out_refund_no: refundRequest.refundNo,
      reason: refundRequest.reason,
      notify_url: 'https://api.example.com/api/orders/refunds/callbacks',
      amount: {
        refund: 5990,
        total: 5990,
        currency: 'CNY'
      }
    });
    expect(result).toEqual({
      skipped: false,
      providerRefundNo: 'wx-refund-001',
      payload: {
        refund_id: 'wx-refund-001',
        out_refund_no: refundRequest.refundNo,
        status: 'PROCESSING'
      }
    });
  });

  it('sends a signed Alipay trade refund request with yuan amount', async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      createFetchResponse({
        alipay_trade_refund_response: {
          code: '10000',
          msg: 'Success',
          trade_no: 'ali-trade-001',
          out_trade_no: refundRequest.paymentNo
        }
      })
    );
    const provider = new AlipayRefundChannelProvider(
      {
        gatewayUrl: 'https://openapi.alipay.example.test/gateway.do',
        appId: 'alipay-app-001',
        privateKey: createPrivateKey()
      },
      fetchMock
    );

    const result = await provider.createRefund({ ...refundRequest, channel: 'alipay' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://openapi.alipay.example.test/gateway.do');
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/x-www-form-urlencoded;charset=utf-8');
    const form = new URLSearchParams(init.body);
    expect(form.get('method')).toBe('alipay.trade.refund');
    expect(form.get('app_id')).toBe('alipay-app-001');
    expect(form.get('sign_type')).toBe('RSA2');
    expect(form.get('sign')).toEqual(expect.any(String));
    expect(JSON.parse(form.get('biz_content') ?? '{}')).toEqual({
      trade_no: refundRequest.providerPaymentNo,
      out_request_no: refundRequest.refundNo,
      refund_amount: '59.90',
      refund_reason: refundRequest.reason
    });
    expect(result).toEqual({
      skipped: false,
      providerRefundNo: 'ali-trade-001',
      payload: {
        alipay_trade_refund_response: {
          code: '10000',
          msg: 'Success',
          trade_no: 'ali-trade-001',
          out_trade_no: refundRequest.paymentNo
        }
      }
    });
  });

  it('rejects real WeChat provider creation when required config is missing', () => {
    expect(() =>
      createRefundChannelProviderFromEnv({
        REFUND_CHANNEL_PROVIDER_MODE: 'real',
        WECHAT_PAY_MCH_ID: '1900000109'
      })
    ).toThrow(RefundProviderConfigurationError);
  });

  it('does not call external network in local refund provider mode', async () => {
    const provider = createRefundChannelProviderFromEnv({ REFUND_CHANNEL_PROVIDER_MODE: 'local' });

    await expect(provider.createRefund(refundRequest)).resolves.toEqual({ skipped: true, providerRefundNo: null, payload: null });
    expect(provider).toBeInstanceOf(NoopRefundChannelProvider);
  });

  it('rejects offline cash as a user refund channel', async () => {
    const provider = new NoopRefundChannelProvider();

    await expect(provider.createRefund({ ...refundRequest, channel: 'cash' as never })).rejects.toThrow(
      'refund channel must be wechat or alipay'
    );
  });
});
