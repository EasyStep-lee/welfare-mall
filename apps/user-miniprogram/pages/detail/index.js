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
    checkoutError: '',
    salesFranchiseId: '',
    bindCardNo: '',
    bindCode: '',
    bindingCard: false,
    bindCardMessage: '',
    bindCardError: ''
  },

  onLoad(options) {
    return this.loadDetail(options.itemId, options.franchiseId);
  },

  async loadDetail(itemId, fallbackFranchiseId = '') {
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
        salesFranchiseId: resolveSalesFranchiseId(detail, fallbackFranchiseId),
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

  onBindCardNoInput(event) {
    this.setData({ bindCardNo: String(event?.detail?.value ?? ''), bindCardError: '', bindCardMessage: '' });
  },

  onBindCodeInput(event) {
    this.setData({ bindCode: String(event?.detail?.value ?? ''), bindCardError: '', bindCardMessage: '' });
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
  },

  async submitBindWelfareCard() {
    const franchiseId = String(this.data.salesFranchiseId || '').trim();
    const cardNo = String(this.data.bindCardNo || '').trim();
    const bindCode = String(this.data.bindCode || '').trim();

    if (!franchiseId) {
      this.setData({ bindCardError: '当前商品缺少销售加盟商，不能绑定福利卡' });
      return;
    }

    if (!cardNo || !bindCode) {
      this.setData({ bindCardError: '请填写福利卡卡号和绑定码' });
      return;
    }

    this.setData({ bindingCard: true, bindCardError: '', bindCardMessage: '' });

    try {
      const result = await requestJson(`/franchises/${encodeURIComponent(franchiseId)}/welfare-cards/bind`, {
        method: 'POST',
        data: {
          requestId: createBindCardRequestId(cardNo),
          cardNo,
          bindCode
        }
      });

      this.setData({
        bindCardNo: '',
        bindCode: '',
        bindingCard: false,
        bindCardMessage: `福利卡绑定成功，余额 ${formatMoney(result.account?.balanceAmount)}`,
        bindCardError: ''
      });
    } catch (error) {
      this.setData({
        bindingCard: false,
        bindCardError: error instanceof Error ? error.message : '福利卡绑定失败'
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

function createBindCardRequestId(cardNo, now = Date.now) {
  const safeCardNo = String(cardNo || '').trim().replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `mini-bind-${safeCardNo}-${now()}`;
}

function resolveSalesFranchiseId(detail, fallbackFranchiseId = '') {
  return String(
    detail?.franchiseId ||
      detail?.productPool?.franchiseId ||
      detail?.product?.franchiseId ||
      fallbackFranchiseId ||
      ''
  ).trim();
}
