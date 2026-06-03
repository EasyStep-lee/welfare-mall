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

export async function fetchProductPoolCatalog(): Promise<ProductPoolCatalogResponse> {
  const response = await fetch(`${apiBaseUrl()}/product-pools/catalog`);

  if (!response.ok) {
    throw new Error(`Failed to load product pool catalog: ${response.status}`);
  }

  return response.json() as Promise<ProductPoolCatalogResponse>;
}

function apiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';
}
