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

function apiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';
}
