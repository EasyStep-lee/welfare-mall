const DEFAULT_API_BASE_URL = 'http://localhost:3000/api';

function apiUrl(path, baseUrl = DEFAULT_API_BASE_URL) {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${normalizedBase}${normalizedPath}`;
}

function productPoolCatalogUrl(baseUrl) {
  return apiUrl('/product-pools/catalog', baseUrl);
}

function productPoolItemDetailUrl(itemId, baseUrl) {
  return apiUrl(`/product-pools/items/${encodeURIComponent(itemId)}`, baseUrl);
}

function orderAmountPreviewUrl(baseUrl) {
  return apiUrl('/orders/amount-preview', baseUrl);
}

function orderCheckoutUrl(baseUrl) {
  return apiUrl('/orders', baseUrl);
}

function orderListUrl(buyerUserId, baseUrl) {
  return apiUrl(`/orders?buyerUserId=${encodeURIComponent(buyerUserId)}`, baseUrl);
}

function orderDetailUrl(orderNo, buyerUserId, baseUrl) {
  return apiUrl(`/orders/${encodeURIComponent(orderNo)}?buyerUserId=${encodeURIComponent(buyerUserId)}`, baseUrl);
}

function requestJson(path, options = {}) {
  const app = typeof getApp === 'function' ? getApp() : null;
  const baseUrl = options.baseUrl || app?.globalData?.apiBaseUrl || DEFAULT_API_BASE_URL;

  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl(path, baseUrl),
      method: options.method || 'GET',
      data: options.data,
      success(response) {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(response.data);
          return;
        }

        reject(new Error(`Request failed: ${response.statusCode}`));
      },
      fail(error) {
        reject(error);
      }
    });
  });
}

module.exports = {
  DEFAULT_API_BASE_URL,
  apiUrl,
  orderAmountPreviewUrl,
  orderCheckoutUrl,
  orderDetailUrl,
  orderListUrl,
  productPoolCatalogUrl,
  productPoolItemDetailUrl,
  requestJson
};
