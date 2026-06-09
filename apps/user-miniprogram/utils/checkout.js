const { formatMoney } = require('./format');

function buildAmountPreviewPayload(input) {
  return {
    items: [
      {
        productPoolItemId: normalizeText(input.itemId),
        quantity: normalizePositiveInteger(input.quantity, 1)
      }
    ],
    welfareCardPaymentAmount: normalizeNonNegativeInteger(input.welfareCardPaymentAmount, 0)
  };
}

function buildCheckoutPayload(input) {
  return {
    requestId: normalizeText(input.requestId),
    buyerUserId: normalizeText(input.buyerUserId),
    ...buildAmountPreviewPayload(input),
    fulfillment: {
      type: 'delivery',
      receiverName: normalizeText(input.receiverName),
      receiverPhone: normalizeText(input.receiverPhone),
      receiverAddress: normalizeText(input.receiverAddress)
    }
  };
}

function createCheckoutRequestId(itemId, now = Date.now) {
  const safeItemId = normalizeText(itemId).replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  return `mini-checkout-${safeItemId}-${now()}`;
}

function toPreviewDisplay(preview) {
  return {
    totalText: formatMoney(preview.totalAmount),
    welfareCardText: formatMoney(preview.welfareCardPayableAmount),
    onlineRemainderText: formatMoney(preview.cashPayableAmount)
  };
}

function normalizeText(value) {
  return String(value ?? '').trim();
}

function normalizePositiveInteger(value, fallback) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function normalizeNonNegativeInteger(value, fallback) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    return fallback;
  }

  return parsed;
}

module.exports = {
  buildAmountPreviewPayload,
  buildCheckoutPayload,
  createCheckoutRequestId,
  toPreviewDisplay
};
