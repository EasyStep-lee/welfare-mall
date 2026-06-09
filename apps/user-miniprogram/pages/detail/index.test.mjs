import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const detailWxml = readFileSync(fileURLToPath(new URL('./index.wxml', import.meta.url)), 'utf8');

const detailResponse = {
  itemId: 'pool-item-001',
  displayName: 'Local Rice',
  displaySkuCode: 'SKU-RICE-5KG',
  displayPriceAmount: 6990,
  displayImageUrl: 'https://cdn.example.com/rice.jpg',
  product: {
    origin: { country: 'China', province: 'Heilongjiang', city: 'Harbin' },
    parameters: [],
    qualifications: [],
    detailSections: []
  }
};

const previewResponse = {
  totalAmount: 13980,
  welfareCardPayableAmount: 5000,
  cashPayableAmount: 8980
};

function mountPage() {
  let pageDefinition;
  const requests = [];

  global.Page = vi.fn((definition) => {
    pageDefinition = definition;
  });
  global.getApp = vi.fn(() => ({ globalData: { apiBaseUrl: 'http://localhost:3000/api' } }));
  global.wx = {
    request: vi.fn((request) => {
      requests.push(request);

      if (request.url.endsWith('/product-pools/items/pool-item-001')) {
        request.success({ statusCode: 200, data: detailResponse });
        return;
      }

      if (request.url.endsWith('/orders/amount-preview')) {
        request.success({ statusCode: 200, data: previewResponse });
        return;
      }

      if (request.url.endsWith('/orders')) {
        request.success({
          statusCode: 201,
          data: {
            idempotentReplay: false,
            order: {
              orderNo: 'ORDER-20260603-001',
              status: 'pending_payment',
              totalAmount: 13980,
              welfareCardPayableAmount: 5000,
              cashPayableAmount: 8980
            }
          }
        });
      }
    })
  };

  delete require.cache[require.resolve('./index.js')];
  require('./index.js');

  const page = {
    ...pageDefinition,
    data: { ...pageDefinition.data },
    setData(update) {
      this.data = { ...this.data, ...update };
    }
  };

  return { page, requests };
}

describe('user mini-program product detail checkout flow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('previews amount and creates an order from the detail page', async () => {
    const { page, requests } = mountPage();

    await page.loadDetail('pool-item-001');
    page.onQuantityInput({ detail: { value: '2' } });
    page.onWelfareAmountInput({ detail: { value: '5000' } });
    page.onReceiverNameInput({ detail: { value: 'Li Lei' } });
    page.onReceiverPhoneInput({ detail: { value: '13800000000' } });
    page.onReceiverAddressInput({ detail: { value: 'Pudong Avenue 1' } });

    await page.refreshAmountPreview();
    await page.submitOrder();

    const previewRequest = requests.find((request) => request.url.endsWith('/orders/amount-preview'));
    expect(previewRequest).toMatchObject({
      method: 'POST',
      data: {
        items: [{ productPoolItemId: 'pool-item-001', quantity: 2 }],
        welfareCardPaymentAmount: 5000
      }
    });

    const checkoutRequest = requests.find((request) => request.url.endsWith('/orders'));
    expect(checkoutRequest).toMatchObject({
      method: 'POST',
      data: {
        buyerUserId: 'local-user-001',
        items: [{ productPoolItemId: 'pool-item-001', quantity: 2 }],
        welfareCardPaymentAmount: 5000,
        fulfillment: {
          type: 'delivery',
          receiverName: 'Li Lei',
          receiverPhone: '13800000000',
          receiverAddress: 'Pudong Avenue 1'
        }
      }
    });
    expect(checkoutRequest.data.requestId).toContain('mini-checkout-pool-item-001-');
    expect(page.data.previewText).toEqual({
      totalText: '¥139.80',
      welfareCardText: '¥50.00',
      onlineRemainderText: '¥89.80'
    });
    expect(page.data.createdOrder).toMatchObject({
      orderNo: 'ORDER-20260603-001',
      status: 'pending_payment'
    });
  });

  it('labels the amount preview as welfare-card debit plus online remainder', () => {
    expect(detailWxml).toContain('福利卡抵扣');
    expect(detailWxml).toContain('线上补差');
    expect(detailWxml).not.toContain('现金支付');
  });
});
