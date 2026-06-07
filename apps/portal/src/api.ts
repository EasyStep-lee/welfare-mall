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

function apiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';
}
