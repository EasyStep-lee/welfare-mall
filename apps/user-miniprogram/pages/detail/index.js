const { requestJson } = require('../../utils/api');
const {
  buildAmountPreviewPayload,
  buildCheckoutPayload,
  createCheckoutRequestId,
  toPreviewDisplay
} = require('../../utils/checkout');
const { formatMoney, joinOrigin } = require('../../utils/format');

const LOCAL_BUYER_USER_ID = 'local-user-001';

Page({
  data: {
    loading: true,
    error: '',
    detail: null,
    priceText: '',
    originText: '',
    itemId: '',
    quantity: 1,
    welfareCardPaymentAmount: 0,
    receiverName: '',
    receiverPhone: '',
    receiverAddress: '',
    amountPreview: null,
    previewText: null,
    previewingAmount: false,
    creatingOrder: false,
    createdOrder: null,
    checkoutError: ''
  },

  onLoad(options) {
    this.loadDetail(options.itemId);
  },

  async loadDetail(itemId) {
    if (!itemId) {
      this.setData({ loading: false, error: '缺少商品参数' });
      return;
    }

    this.setData({ loading: true, error: '' });

    try {
      const detail = await requestJson(`/product-pools/items/${decodeURIComponent(itemId)}`);
      this.setData({
        detail,
        itemId: detail.itemId || decodeURIComponent(itemId),
        priceText: formatMoney(detail.displayPriceAmount),
        originText: joinOrigin(detail.product?.origin),
        loading: false
      });
    } catch (error) {
      this.setData({
        detail: null,
        loading: false,
        error: error instanceof Error ? error.message : '商品详情加载失败'
      });
    }
  },

  onQuantityInput(event) {
    this.setData({
      quantity: toPositiveInteger(event?.detail?.value, 1),
      checkoutError: ''
    });
  },

  onWelfareAmountInput(event) {
    this.setData({
      welfareCardPaymentAmount: toNonNegativeInteger(event?.detail?.value, 0),
      checkoutError: ''
    });
  },

  onReceiverNameInput(event) {
    this.setData({ receiverName: String(event?.detail?.value ?? ''), checkoutError: '' });
  },

  onReceiverPhoneInput(event) {
    this.setData({ receiverPhone: String(event?.detail?.value ?? ''), checkoutError: '' });
  },

  onReceiverAddressInput(event) {
    this.setData({ receiverAddress: String(event?.detail?.value ?? ''), checkoutError: '' });
  },

  async refreshAmountPreview() {
    if (!this.data.itemId) {
      this.setData({ checkoutError: '缺少商品参数' });
      return;
    }

    this.setData({ previewingAmount: true, checkoutError: '' });

    try {
      const amountPreview = await requestJson('/orders/amount-preview', {
        method: 'POST',
        data: buildAmountPreviewPayload({
          itemId: this.data.itemId,
          quantity: this.data.quantity,
          welfareCardPaymentAmount: this.data.welfareCardPaymentAmount
        })
      });

      this.setData({
        amountPreview,
        previewText: toPreviewDisplay(amountPreview),
        previewingAmount: false
      });
    } catch (error) {
      this.setData({
        amountPreview: null,
        previewText: null,
        previewingAmount: false,
        checkoutError: error instanceof Error ? error.message : '金额预览失败'
      });
    }
  },

  async submitOrder() {
    if (!this.data.itemId) {
      this.setData({ checkoutError: '缺少商品参数' });
      return;
    }

    this.setData({ creatingOrder: true, checkoutError: '', createdOrder: null });

    try {
      const result = await requestJson('/orders', {
        method: 'POST',
        data: buildCheckoutPayload({
          requestId: createCheckoutRequestId(this.data.itemId),
          buyerUserId: LOCAL_BUYER_USER_ID,
          itemId: this.data.itemId,
          quantity: this.data.quantity,
          welfareCardPaymentAmount: this.data.welfareCardPaymentAmount,
          receiverName: this.data.receiverName,
          receiverPhone: this.data.receiverPhone,
          receiverAddress: this.data.receiverAddress
        })
      });

      this.setData({
        createdOrder: result.order,
        creatingOrder: false
      });
    } catch (error) {
      this.setData({
        creatingOrder: false,
        checkoutError: error instanceof Error ? error.message : '订单创建失败'
      });
    }
  }
});

function toPositiveInteger(value, fallback) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function toNonNegativeInteger(value, fallback) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    return fallback;
  }

  return parsed;
}
