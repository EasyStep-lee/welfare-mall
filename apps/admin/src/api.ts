export type ReviewQueueStatus = 'pending_review' | 'approved' | 'rejected';

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

export const statusLabels: Record<ReviewQueueStatus, string> = {
  pending_review: '待审核',
  approved: '已通过',
  rejected: '已驳回'
};

const defaultApiBaseUrl = 'http://localhost:3000/api';

function apiBaseUrl() {
  return import.meta.env.VITE_ADMIN_API_BASE_URL ?? defaultApiBaseUrl;
}

export async function fetchReviewQueue(status: ReviewQueueStatus): Promise<ReviewQueueResponse> {
  const url = new URL(`${apiBaseUrl()}/products/review-queue`);
  url.searchParams.set('status', status);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load review queue: ${response.status}`);
  }

  return response.json() as Promise<ReviewQueueResponse>;
}

export async function decideProductReview(input: {
  productId: string;
  action: 'approve' | 'reject';
  actorUserId: string;
  reason?: string | null;
}) {
  const response = await fetch(`${apiBaseUrl()}/products/${input.productId}/review-decisions`, {
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
  const response = await fetch(`${apiBaseUrl()}/product-pools/items/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(`Failed to publish product: ${response.status}`);
  }

  return response.json();
}
