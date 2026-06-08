export type ProductPoolCatalogItem = {
  id: string;
  productId: string;
  skuId: string | null;
  sortOrder: number;
  displayName: string;
  displaySkuCode: string | null;
  displayPriceAmount: number;
  displayImageUrl: string;
};

export type ProductPoolCatalog = {
  id: string;
  code: string;
  name: string;
  status: string;
  franchiseId: string | null;
  items: ProductPoolCatalogItem[];
};

export type ProductPoolCatalogResponse = {
  productPools: ProductPoolCatalog[];
};

export type ProductPoolItemDetail = ProductPoolCatalogItem & {
  productPoolId: string;
  product: {
    code: string;
    name: string;
    origin: {
      country: string | null;
      province: string | null;
      city: string | null;
      description: string | null;
    } | null;
    brand: {
      id: string;
      code: string;
      name: string;
    } | null;
    category: {
      id: string;
      code: string;
      name: string;
    } | null;
    media: Array<{
      type: string;
      url: string;
      sortOrder: number;
    }>;
    qualifications: Array<{
      type: string;
      title: string;
      certificateNo: string | null;
      fileUrl: string | null;
    }>;
    parameters: Array<{
      groupName: string | null;
      name: string;
      value: string;
      valueType: string;
      sortOrder: number;
    }>;
    detailSections: Array<{
      type: string;
      title: string | null;
      content: string | null;
      sortOrder: number;
    }>;
  };
  sku: {
    code: string;
    priceAmount: number;
    marketPriceAmount: number | null;
    specText: string | null;
  } | null;
};

export type PortalOrderCheckoutInput = {
  requestId: string;
  buyerUserId: string;
  productPoolItemId: string;
  quantity: number;
  welfareCardPaymentAmount: number;
  fulfillment: {
    type: 'delivery';
    receiverName: string;
    receiverPhone: string;
    receiverAddress: string;
  };
};

export type PortalCheckoutOrder = {
  orderNo: string;
  status: string;
  totalAmount: number;
  welfareCardPayableAmount: number;
  cashPayableAmount: number;
};

export type PortalOrderLine = {
  id: string;
  productPoolItemId: string;
  productId: string;
  skuId: string | null;
  displayName: string;
  displaySkuCode: string | null;
  displayImageUrl: string;
  unitPriceAmount: number;
  quantity: number;
  lineTotalAmount: number;
};

export type PortalOrderRecord = PortalCheckoutOrder & {
  buyerUserId: string;
  subtotalAmount: number;
  discountAmount: number;
  fulfillmentType: string;
  receiverName: string | null;
  receiverPhone: string | null;
  receiverAddress: string | null;
  pickupStoreName: string | null;
  createdAt: string;
  updatedAt: string;
  latestPayment: PortalPayment | null;
  lines: PortalOrderLine[];
};

export type PortalOrderListResponse = {
  orders: PortalOrderRecord[];
};

export type PortalOrderDetailResponse = {
  order: PortalOrderRecord;
};

export type PortalPaymentInput = {
  requestId: string;
  orderNo: string;
  channel: 'wechat';
  totalAmount: number;
  welfareCardPayableAmount: number;
  cashPayableAmount: number;
};

export type PortalPayment = {
  id?: string;
  paymentNo: string;
  requestId: string;
  orderNo: string;
  status: string;
  channel: string;
  totalAmount: number;
  welfareCardPayableAmount: number;
  cashPayableAmount: number;
  providerPaymentNo: string | null;
  paidAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type PortalPaymentResponse = {
  idempotentReplay: boolean;
  payment: PortalPayment;
};

export type PortalPaymentCallbackInput = {
  providerEventId: string;
  paymentNo: string;
  providerPaymentNo: string;
  status: 'paid';
  paidAt: string;
  payload: Record<string, unknown>;
};

export type PortalPaymentCallbackResponse = {
  duplicate: boolean;
  payment: {
    paymentNo: string;
    status: string;
    providerPaymentNo: string | null;
  };
  callback: {
    providerEventId: string;
    status: string;
  };
};

export type PortalOrderCheckoutResponse = {
  idempotentReplay: boolean;
  order: PortalCheckoutOrder;
};

export async function fetchProductPoolCatalog(): Promise<ProductPoolCatalogResponse> {
  const response = await fetch(`${apiBaseUrl()}/product-pools/catalog`);

  if (!response.ok) {
    throw new Error(`Failed to load product pool catalog: ${response.status}`);
  }

  return response.json() as Promise<ProductPoolCatalogResponse>;
}

export async function fetchProductPoolItemDetail(itemId: string): Promise<ProductPoolItemDetail> {
  const response = await fetch(`${apiBaseUrl()}/product-pools/items/${encodeURIComponent(itemId)}`);

  if (!response.ok) {
    throw new Error(`Failed to load product pool item detail: ${response.status}`);
  }

  return response.json() as Promise<ProductPoolItemDetail>;
}

export async function createPortalOrder(input: PortalOrderCheckoutInput): Promise<PortalOrderCheckoutResponse> {
  const response = await fetch(`${apiBaseUrl()}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestId: input.requestId,
      buyerUserId: input.buyerUserId,
      items: [{ productPoolItemId: input.productPoolItemId, quantity: input.quantity }],
      welfareCardPaymentAmount: input.welfareCardPaymentAmount,
      fulfillment: input.fulfillment
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to create order: ${response.status}`);
  }

  return response.json() as Promise<PortalOrderCheckoutResponse>;
}

export async function fetchPortalOrders(buyerUserId: string): Promise<PortalOrderListResponse> {
  const url = new URL(`${apiBaseUrl()}/orders`);
  url.searchParams.set('buyerUserId', buyerUserId);
  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Failed to load orders: ${response.status}`);
  }

  return response.json() as Promise<PortalOrderListResponse>;
}

export async function fetchPortalOrderDetail(input: {
  orderNo: string;
  buyerUserId: string;
}): Promise<PortalOrderDetailResponse> {
  const url = new URL(`${apiBaseUrl()}/orders/${encodeURIComponent(input.orderNo)}`);
  url.searchParams.set('buyerUserId', input.buyerUserId);
  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Failed to load order detail: ${response.status}`);
  }

  return response.json() as Promise<PortalOrderDetailResponse>;
}

export async function createPortalPayment(input: PortalPaymentInput): Promise<PortalPaymentResponse> {
  const response = await fetch(`${apiBaseUrl()}/orders/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(`Failed to create payment: ${response.status}`);
  }

  return response.json() as Promise<PortalPaymentResponse>;
}

export async function confirmPortalPayment(input: PortalPaymentCallbackInput): Promise<PortalPaymentCallbackResponse> {
  const response = await fetch(`${apiBaseUrl()}/orders/payments/callbacks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(`Failed to confirm payment: ${response.status}`);
  }

  return response.json() as Promise<PortalPaymentCallbackResponse>;
}

function apiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';
}
