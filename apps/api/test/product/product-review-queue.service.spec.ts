import { BadRequestException } from '@nestjs/common';
import { ProductReviewQueueRepository } from '../../src/product/product-review-queue.repository';
import { ProductReviewQueueService } from '../../src/product/product-review-queue.service';

function createRepositoryMock() {
  return {
    list: jest.fn(async ({ status }) => ({ status, items: [] }))
  };
}

describe('ProductReviewQueueService', () => {
  it('allows merchants to list draft products for submission', async () => {
    const repository = createRepositoryMock();
    const service = new ProductReviewQueueService(repository as unknown as ProductReviewQueueRepository);

    const result = await service.list({ status: 'draft' });

    expect(repository.list).toHaveBeenCalledWith({ status: 'draft' });
    expect(result).toEqual({ status: 'draft', items: [] });
  });

  it('rejects unsupported queue status values', async () => {
    const repository = createRepositoryMock();
    const service = new ProductReviewQueueService(repository as unknown as ProductReviewQueueRepository);

    await expect(service.list({ status: 'archived' })).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.list).not.toHaveBeenCalled();
  });
});
