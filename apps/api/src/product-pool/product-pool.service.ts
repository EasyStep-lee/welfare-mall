import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  ProductPoolCatalogQuery,
  ProductPoolCatalogResult,
  ProductPoolItemDetail,
  ProductPoolRepository,
  PublishProductPoolInput,
  PublishProductPoolResult
} from './product-pool.repository';

export type ProductPoolPublishSummary = Extract<PublishProductPoolResult, { allowed: true }>;

@Injectable()
export class ProductPoolService {
  constructor(private readonly productPoolRepository: ProductPoolRepository) {}

  async publishApprovedProduct(input: PublishProductPoolInput): Promise<ProductPoolPublishSummary> {
    const result = await this.productPoolRepository.publishApprovedProduct(input);

    if (!result) {
      throw new NotFoundException(`Product ${input.productId} not found.`);
    }

    if (!result.allowed) {
      throw new BadRequestException({
        message: 'Product cannot be published to product pool.',
        productId: result.productId,
        reasonCode: result.reasonCode,
        reason: result.reason
      });
    }

    return result;
  }

  async listCatalog(query: ProductPoolCatalogQuery): Promise<ProductPoolCatalogResult> {
    return this.productPoolRepository.listCatalog(query);
  }

  async getItemDetail(itemId: string): Promise<ProductPoolItemDetail> {
    const result = await this.productPoolRepository.getItemDetail(itemId);

    if (!result) {
      throw new NotFoundException(`Product pool item ${itemId} not found.`);
    }

    return result;
  }
}
