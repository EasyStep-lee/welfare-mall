export type SubmissionQueueStatus = 'draft' | 'rejected';
export type MerchantFulfillmentStatusFilter = 'paid' | 'completed';
export type MerchantSettlementStatementStatusFilter = 'generated' | 'paid_offline' | 'all';

export type BusinessParty = {
  id: string;
  code: string;
  name: string;
};

export type SubmissionQueueItem = {
  productId: string;
  code: string;
  name: string;
  status: SubmissionQueueStatus;
  saleStatus: string;
  merchant: BusinessParty;
  franchise: BusinessParty;
  category: BusinessParty;
  brand: BusinessParty | null;
  origin: {
    country: string;
    province: string | null;
    city: string | null;
    description: string | null;
  };
  skuCount: number;
  imageCount: number;
  qualificationCount: number;
  parameterCount: number;
  detailSectionCount: number;
  primaryImageUrl: string | null;
  latestReviewLog: {
    action: string;
    actorUserId: string | null;
    reason: string | null;
    createdAt: string;
  } | null;
};

export type SubmissionQueueResponse = {
  status: SubmissionQueueStatus;
  items: SubmissionQueueItem[];
};

export type ProductDraftPayload = {
  code: string;
  name: string;
  merchantId: string;
  franchiseId: string;
  categoryId: string;
  brandId: string;
  originCountry: string;
  originProvince: string;
  originCity: string;
  originDescription: string;
  skus: Array<{
    code: string;
    priceAmount: number;
    marketPriceAmount: number;
    costPriceAmount: number;
    barcode: string;
    specs: Array<{ name: string; value: string }>;
    weightGrams: number;
    volumeMilliliters: number;
  }>;
  media: Array<{
    type: 'main_image' | 'detail_image';
    url: string;
    sortOrder: number;
    altText: string;
  }>;
  qualifications: Array<{
    type: 'origin_certificate';
    title: string;
    certificateNo: string;
    fileUrl: string;
    validFrom: string;
    validTo: string;
  }>;
  parameters: Array<{
    groupName: string;
    name: string;
    value: string;
    valueType: 'text';
    sortOrder: number;
  }>;
  detailSections: Array<{
    type: 'text';
    title: string;
    content: string;
    sortOrder: number;
  }>;
};

export type MerchantFulfillmentOrderLine = {
  displayName: string;
  displaySkuCode: string | null;
  quantity: number;
  lineTotalAmount: number;
};

export type MerchantFulfillmentOrder = {
  id: string;
  taskNo: string;
  orderNo: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  totalAmount: number;
  cashPayableAmount: number;
  welfareCardPayableAmount: number;
  fulfillmentType: string;
  receiverName: string | null;
  receiverPhone: string | null;
  receiverAddress: string | null;
  pickupStoreName: string | null;
  pickupCode: string | null;
  latestPayment: {
    paymentNo: string;
    status: string;
    channel: string;
  } | null;
  lines: MerchantFulfillmentOrderLine[];
};

export type MerchantFulfillmentQueueResponse = {
  orders: MerchantFulfillmentOrder[];
};

export type MerchantSettlementBillItem = {
  id: string;
  billItemNo: string;
  merchantId: string;
  orderNo: string;
  orderLineId: string;
  productId: string;
  skuId: string | null;
  source: string;
  status: string;
  grossAmount: number;
  refundOffsetAmount: number;
  adjustmentAmount: number;
  netAmount: number;
  statementId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MerchantSettlementStatement = {
  id: string;
  statementNo: string;
  merchantId: string;
  status: string;
  itemCount: number;
  grossAmount: number;
  refundOffsetAmount: number;
  adjustmentAmount: number;
  netAmount: number;
  generatedAt: string;
  paidAt: string | null;
  items: MerchantSettlementBillItem[];
};

export type MerchantSettlementStatementResponse = {
  statements: MerchantSettlementStatement[];
};

export type MerchantFulfillmentLookupFilters = {
  orderNo?: string;
  taskNo?: string;
};

export const statusLabels: Record<SubmissionQueueStatus, string> = {
  draft: '草稿',
  rejected: '已驳回'
};

export const merchantFulfillmentStatusLabels: Record<MerchantFulfillmentStatusFilter, string> = {
  paid: '待履约',
  completed: '已完成'
};

export const merchantSettlementStatementStatusLabels: Record<MerchantSettlementStatementStatusFilter, string> = {
  generated: '待打款',
  paid_offline: '已打款',
  all: '全部结算'
};

const defaultApiBaseUrl = 'http://localhost:3000/api';

function apiBaseUrl() {
  return import.meta.env.VITE_MERCHANT_API_BASE_URL ?? defaultApiBaseUrl;
}

export async function fetchMerchantSubmissionQueue(status: SubmissionQueueStatus): Promise<SubmissionQueueResponse> {
  const url = new URL(`${apiBaseUrl()}/products/review-queue`);
  url.searchParams.set('status', status);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load merchant product queue: ${response.status}`);
  }

  return response.json() as Promise<SubmissionQueueResponse>;
}

export async function submitProductForReview(input: { productId: string; actorUserId: string }) {
  const response = await fetch(`${apiBaseUrl()}/products/${input.productId}/review-submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actorUserId: input.actorUserId })
  });

  if (!response.ok) {
    throw new Error(`Failed to submit product for review: ${response.status}`);
  }

  return response.json();
}

export async function saveProductDraft(input: { payload: ProductDraftPayload; actorUserId: string; productId?: string | null }) {
  const response = await fetch(`${apiBaseUrl()}/products/drafts/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId: input.productId ?? null,
      payload: input.payload,
      actorUserId: input.actorUserId
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to save product draft: ${response.status}`);
  }

  return response.json();
}

export async function fetchMerchantFulfillmentOrders(
  merchantId: string,
  status: MerchantFulfillmentStatusFilter = 'paid',
  filters: MerchantFulfillmentLookupFilters = {}
): Promise<MerchantFulfillmentQueueResponse> {
  const url = new URL(`${apiBaseUrl()}/orders/merchant/fulfillment`);
  url.searchParams.set('merchantId', merchantId);
  url.searchParams.set('status', status);
  setOptionalSearchParam(url, 'orderNo', filters.orderNo);
  setOptionalSearchParam(url, 'taskNo', filters.taskNo);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Failed to load merchant fulfillment orders: ${response.status}`);
  }

  return response.json() as Promise<MerchantFulfillmentQueueResponse>;
}

export async function fetchMerchantSettlementStatements(
  merchantId: string,
  status: MerchantSettlementStatementStatusFilter = 'generated'
): Promise<MerchantSettlementStatementResponse> {
  const url = new URL(`${apiBaseUrl()}/settlements/merchant-statements`);
  url.searchParams.set('merchantId', merchantId.trim());
  if (status !== 'all') {
    url.searchParams.set('status', status);
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Failed to load merchant settlement statements: ${response.status}`);
  }

  return response.json() as Promise<MerchantSettlementStatementResponse>;
}

function setOptionalSearchParam(url: URL, key: string, value: string | undefined) {
  const trimmed = value?.trim();
  if (trimmed) {
    url.searchParams.set(key, trimmed);
  }
}

export async function completeMerchantFulfillmentOrder(input: { merchantId: string; orderNo: string; pickupCode?: string }) {
  const pickupCode = input.pickupCode?.trim();
  const response = await fetch(`${apiBaseUrl()}/orders/merchant/fulfillment/${input.orderNo}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      merchantId: input.merchantId,
      ...(pickupCode ? { pickupCode } : {})
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to complete merchant fulfillment order: ${response.status}`);
  }

  return response.json();
}
