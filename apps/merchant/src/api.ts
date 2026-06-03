export type SubmissionQueueStatus = 'draft' | 'rejected';

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

export const statusLabels: Record<SubmissionQueueStatus, string> = {
  draft: '草稿',
  rejected: '已驳回'
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
