export type ReviewQueueStatus = 'pending_review' | 'approved' | 'rejected';
export type AdminOrderStatusFilter =
  | 'all'
  | 'pending_payment'
  | 'paid'
  | 'refund_processing'
  | 'refunded'
  | 'cancelled'
  | 'completed';
export type AdminFulfillmentStatusFilter = 'all' | 'pending' | 'completed';
export type AdminInventoryReservationStatusFilter = 'all' | 'reserved' | 'released';
export type AdminSettlementStatementStatusFilter = 'all' | 'generated' | 'paid_offline';

export type BusinessParty = {
  id: string;
  code: string;
  name: string;
};

export type ReviewQueueItem = {
  productId: string;
  code: string;
  name: string;
  status: ReviewQueueStatus;
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
  primarySku: {
    code: string;
    priceAmount: number;
    marketPriceAmount: number;
    specText: string;
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
    groupName: string;
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
  latestReviewLog: {
    action: string;
    actorUserId: string | null;
    reason: string | null;
    createdAt: string;
  } | null;
};

export type ReviewQueueResponse = {
  status: ReviewQueueStatus;
  items: ReviewQueueItem[];
};

export type AdminOrder = {
  orderNo: string;
  buyerUserId: string;
  status: string;
  totalAmount: number;
  welfareCardPayableAmount: number;
  cashPayableAmount: number;
  fulfillmentType: string;
  receiverName: string | null;
  receiverPhone: string | null;
  receiverAddress: string | null;
  pickupStoreName: string | null;
  latestPayment: {
    paymentNo: string;
    status: string;
    channel: string;
  } | null;
  latestRefund: {
    refundNo: string;
    status: string;
    channel: string;
    refundAmount: number;
    reason: string;
  } | null;
  fulfillmentSummary: {
    totalTasks: number;
    pendingTasks: number;
    completedTasks: number;
    taskNos: string[];
  };
  fulfillmentTasks: Array<{
    taskNo: string;
    merchantId: string;
    status: string;
    pickupCode: string | null;
    createdAt: string;
    completedAt: string | null;
  }>;
  lines: Array<{
    displayName: string;
    displaySkuCode: string | null;
    quantity: number;
    lineTotalAmount: number;
  }>;
};

export type AdminOrderResponse = {
  orders: AdminOrder[];
};

export type AdminInventoryReservation = {
  id: string;
  orderNo: string;
  orderLineId: string;
  productId: string;
  skuId: string | null;
  merchantId: string;
  quantity: number;
  status: string;
  source: string;
  releasedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminInventoryReservationResponse = {
  reservations: AdminInventoryReservation[];
};

export type AdminInventoryStock = {
  id: string;
  stockKey: string;
  productId: string;
  skuId: string | null;
  merchantId: string;
  availableQuantity: number;
  reservedQuantity: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminInventoryStockResponse = {
  stocks: AdminInventoryStock[];
};

export type AdminSettlementBillItem = {
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

export type AdminSettlementStatement = {
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
  payoutReference: string | null;
  payoutRemark: string | null;
  items: AdminSettlementBillItem[];
};

export type AdminSettlementStatementResponse = {
  statements: AdminSettlementStatement[];
};

export type ConfirmSettlementOfflinePayoutResponse = {
  statement: AdminSettlementStatement | null;
};

export type GenerateSettlementStatementResponse = {
  statement: AdminSettlementStatement | null;
};

export type CreateOrderRefundInput = {
  requestId: string;
  paymentNo: string;
  orderNo: string;
  channel: string;
  refundAmount: number;
  reason: 'user_cancel' | 'merchant_out_of_stock' | 'after_sale';
};

export type CreateOrderRefundResponse = {
  idempotentReplay: boolean;
  refund: {
    refundNo: string;
    requestId: string;
    paymentNo: string;
    orderNo: string;
    status: string;
    channel: string;
    refundAmount: number;
    reason: string;
  };
};

export type ProcessOrderPaymentCallbackInput = {
  providerEventId: string;
  paymentNo: string;
  providerPaymentNo: string;
  status: 'paid' | 'failed';
  paidAt: string;
  payload: Record<string, unknown>;
};

export type ProcessOrderPaymentCallbackResponse = {
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

export type ProcessOrderRefundCallbackInput = {
  providerEventId: string;
  refundNo: string;
  providerRefundNo: string;
  status: 'succeeded' | 'failed';
  succeededAt: string;
  payload: Record<string, unknown>;
};

export type ProcessOrderRefundCallbackResponse = {
  duplicate: boolean;
  refund: {
    refundNo: string;
    status: string;
    providerRefundNo: string | null;
  };
  callback: {
    providerEventId: string;
    status: string;
  };
};

export const statusLabels: Record<ReviewQueueStatus, string> = {
  pending_review: '待审核',
  approved: '已通过',
  rejected: '已驳回'
};

export const adminOrderStatusLabels: Record<AdminOrderStatusFilter, string> = {
  all: '全部',
  pending_payment: '待支付',
  paid: '已支付',
  refund_processing: '退款中',
  refunded: '已退款',
  cancelled: '已取消',
  completed: '已完成'
};

export const adminFulfillmentStatusLabels: Record<AdminFulfillmentStatusFilter, string> = {
  all: '全部履约',
  pending: '待履约',
  completed: '履约完成'
};

export const adminInventoryReservationStatusLabels: Record<AdminInventoryReservationStatusFilter, string> = {
  all: '全部库存',
  reserved: '预占中',
  released: '释放记录'
};

export const adminSettlementStatementStatusLabels: Record<AdminSettlementStatementStatusFilter, string> = {
  all: '全部结算',
  generated: '待打款',
  paid_offline: '已打款'
};

const defaultApiBaseUrl = 'http://localhost:3000/api';
type AccessTokenProvider = () => string | null | undefined;
type ApiHeaders = Record<string, string>;

function apiBaseUrl() {
  return import.meta.env.VITE_ADMIN_API_BASE_URL ?? defaultApiBaseUrl;
}

function defaultAdminAccessTokenProvider() {
  if (typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') {
    return null;
  }

  return localStorage.getItem('welfareMallAdminAccessToken');
}

let adminAccessTokenProvider: AccessTokenProvider = defaultAdminAccessTokenProvider;

export function setAdminAccessTokenProvider(provider: AccessTokenProvider) {
  adminAccessTokenProvider = provider;
}

export function resetAdminAccessTokenProvider() {
  adminAccessTokenProvider = defaultAdminAccessTokenProvider;
}

function withAuthHeaders(headers: ApiHeaders = {}) {
  const token = adminAccessTokenProvider()?.trim();
  if (!token) {
    return headers;
  }

  return {
    ...headers,
    Authorization: `Bearer ${token}`
  };
}

function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
  const token = adminAccessTokenProvider()?.trim();
  if (!token) {
    return init ? fetch(input, init) : fetch(input);
  }

  return fetch(input, {
    ...init,
    headers: withAuthHeaders(init?.headers as ApiHeaders | undefined)
  });
}

export async function fetchReviewQueue(status: ReviewQueueStatus): Promise<ReviewQueueResponse> {
  const url = new URL(`${apiBaseUrl()}/products/review-queue`);
  url.searchParams.set('status', status);

  const response = await apiFetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load review queue: ${response.status}`);
  }

  return response.json() as Promise<ReviewQueueResponse>;
}

export async function fetchAdminOrders(
  status: AdminOrderStatusFilter = 'all',
  fulfillmentStatus: AdminFulfillmentStatusFilter = 'all',
  merchantId?: string,
  taskNo?: string
): Promise<AdminOrderResponse> {
  const url = new URL(`${apiBaseUrl()}/orders/admin`);

  if (status !== 'all') {
    url.searchParams.set('status', status);
  }
  if (fulfillmentStatus !== 'all') {
    url.searchParams.set('fulfillmentStatus', fulfillmentStatus);
  }
  if (merchantId?.trim()) {
    url.searchParams.set('merchantId', merchantId.trim());
  }
  if (taskNo?.trim()) {
    url.searchParams.set('taskNo', taskNo.trim());
  }

  const response = await apiFetch(url.toString());
  if (!response.ok) {
    throw new Error(`Failed to load admin orders: ${response.status}`);
  }

  return response.json() as Promise<AdminOrderResponse>;
}

export async function fetchAdminInventoryReservations(
  status: AdminInventoryReservationStatusFilter = 'all',
  merchantId?: string,
  orderNo?: string
): Promise<AdminInventoryReservationResponse> {
  const url = new URL(`${apiBaseUrl()}/orders/admin/inventory-reservations`);

  if (status !== 'all') {
    url.searchParams.set('status', status);
  }
  if (merchantId?.trim()) {
    url.searchParams.set('merchantId', merchantId.trim());
  }
  if (orderNo?.trim()) {
    url.searchParams.set('orderNo', orderNo.trim());
  }

  const response = await apiFetch(url.toString());
  if (!response.ok) {
    throw new Error(`Failed to load inventory reservations: ${response.status}`);
  }

  return response.json() as Promise<AdminInventoryReservationResponse>;
}

export async function fetchAdminInventoryStocks(
  merchantId?: string,
  productId?: string,
  skuId?: string
): Promise<AdminInventoryStockResponse> {
  const url = new URL(`${apiBaseUrl()}/orders/admin/inventory-stocks`);

  if (merchantId?.trim()) {
    url.searchParams.set('merchantId', merchantId.trim());
  }
  if (productId?.trim()) {
    url.searchParams.set('productId', productId.trim());
  }
  if (skuId?.trim()) {
    url.searchParams.set('skuId', skuId.trim());
  }

  const response = await apiFetch(url.toString());
  if (!response.ok) {
    throw new Error(`Failed to load inventory stocks: ${response.status}`);
  }

  return response.json() as Promise<AdminInventoryStockResponse>;
}

export async function fetchAdminSettlementStatements(
  status: AdminSettlementStatementStatusFilter = 'generated',
  merchantId?: string
): Promise<AdminSettlementStatementResponse> {
  const url = new URL(`${apiBaseUrl()}/settlements/merchant-statements`);

  if (merchantId?.trim()) {
    url.searchParams.set('merchantId', merchantId.trim());
  }
  if (status !== 'all') {
    url.searchParams.set('status', status);
  }

  const response = await apiFetch(url.toString());
  if (!response.ok) {
    throw new Error(`Failed to load settlement statements: ${response.status}`);
  }

  return response.json() as Promise<AdminSettlementStatementResponse>;
}

export async function generateSettlementStatement(input: {
  merchantId: string;
}): Promise<GenerateSettlementStatementResponse> {
  const response = await apiFetch(`${apiBaseUrl()}/settlements/merchant-statements/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ merchantId: input.merchantId.trim() })
  });

  if (!response.ok) {
    throw new Error(`Failed to generate settlement statement: ${response.status}`);
  }

  return response.json() as Promise<GenerateSettlementStatementResponse>;
}

export async function confirmSettlementOfflinePayout(input: {
  statementNo: string;
  paidAt: string;
  payoutReference: string;
  payoutRemark?: string | null;
}): Promise<ConfirmSettlementOfflinePayoutResponse> {
  const response = await apiFetch(
    `${apiBaseUrl()}/settlements/merchant-statements/${encodeURIComponent(input.statementNo)}/confirm-offline-payout`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paidAt: input.paidAt,
        payoutReference: input.payoutReference.trim(),
        payoutRemark: input.payoutRemark?.trim() || null
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to confirm settlement offline payout: ${response.status}`);
  }

  return response.json() as Promise<ConfirmSettlementOfflinePayoutResponse>;
}

export async function createOrderRefund(input: CreateOrderRefundInput): Promise<CreateOrderRefundResponse> {
  const response = await apiFetch(`${apiBaseUrl()}/orders/refunds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(`Failed to create order refund: ${response.status}`);
  }

  return response.json() as Promise<CreateOrderRefundResponse>;
}

export async function processOrderPaymentCallback(
  input: ProcessOrderPaymentCallbackInput
): Promise<ProcessOrderPaymentCallbackResponse> {
  const response = await apiFetch(`${apiBaseUrl()}/orders/payments/callbacks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(`Failed to process order payment callback: ${response.status}`);
  }

  return response.json() as Promise<ProcessOrderPaymentCallbackResponse>;
}

export async function processOrderRefundCallback(
  input: ProcessOrderRefundCallbackInput
): Promise<ProcessOrderRefundCallbackResponse> {
  const response = await apiFetch(`${apiBaseUrl()}/orders/refunds/callbacks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(`Failed to process order refund callback: ${response.status}`);
  }

  return response.json() as Promise<ProcessOrderRefundCallbackResponse>;
}

export async function decideProductReview(input: {
  productId: string;
  action: 'approve' | 'reject';
  actorUserId: string;
  reason?: string | null;
}) {
  const response = await apiFetch(`${apiBaseUrl()}/products/${input.productId}/review-decisions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: input.action,
      actorUserId: input.actorUserId,
      reason: input.reason ?? null
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to submit review decision: ${response.status}`);
  }

  return response.json();
}

export async function publishProductToPool(input: { productId: string; actorUserId: string }) {
  const response = await apiFetch(`${apiBaseUrl()}/product-pools/items/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(`Failed to publish product: ${response.status}`);
  }

  return response.json();
}
