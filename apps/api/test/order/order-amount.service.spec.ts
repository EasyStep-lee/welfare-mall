import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderAmountRepository } from '../../src/order/order-amount.repository';
import { OrderAmountService } from '../../src/order/order-amount.service';

function createRepositoryMock() {
  return {
    listAmountItemsByIds: jest.fn().mockResolvedValue([
      {
        id: 'pool-item-001',
        productId: 'product-001',
        skuId: 'sku-001',
        displayName: '东北五常大米福利装',
        displaySkuCode: 'SKU-RICE-5KG',
        displayPriceAmount: 6990,
        displayImageUrl: 'https://cdn.example.com/products/rice-main.jpg'
      }
    ])
  };
}

describe('OrderAmountService', () => {
  it('calculates order amount from product pool item snapshot prices', async () => {
    const repository = createRepositoryMock();
    const service = new OrderAmountService(repository as unknown as OrderAmountRepository);

    const result = await service.previewAmount({
      items: [{ productPoolItemId: 'pool-item-001', quantity: 2 }]
    });

    expect(repository.listAmountItemsByIds).toHaveBeenCalledWith(['pool-item-001']);
    expect(result).toEqual({
      lines: [
        {
          productPoolItemId: 'pool-item-001',
          productId: 'product-001',
          skuId: 'sku-001',
          displayName: '东北五常大米福利装',
          displaySkuCode: 'SKU-RICE-5KG',
          displayImageUrl: 'https://cdn.example.com/products/rice-main.jpg',
          unitPriceAmount: 6990,
          quantity: 2,
          lineTotalAmount: 13980
        }
      ],
      subtotalAmount: 13980,
      discountAmount: 0,
      totalAmount: 13980,
      welfareCardPayableAmount: 0,
      cashPayableAmount: 13980
    });
  });

  it('splits order amount into welfare-card payable and cash payable amounts', async () => {
    const repository = createRepositoryMock();
    const service = new OrderAmountService(repository as unknown as OrderAmountRepository);

    const result = await service.previewAmount({
      items: [{ productPoolItemId: 'pool-item-001', quantity: 2 }],
      welfareCardPaymentAmount: 5000
    });

    expect(result).toEqual(
      expect.objectContaining({
        totalAmount: 13980,
        welfareCardPayableAmount: 5000,
        cashPayableAmount: 8980
      })
    );
  });

  it('rejects welfare-card payment amount greater than total amount', async () => {
    const repository = createRepositoryMock();
    const service = new OrderAmountService(repository as unknown as OrderAmountRepository);

    await expect(
      service.previewAmount({
        items: [{ productPoolItemId: 'pool-item-001', quantity: 2 }],
        welfareCardPaymentAmount: 14000
      })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects invalid item quantities before reading product pool prices', async () => {
    const repository = createRepositoryMock();
    const service = new OrderAmountService(repository as unknown as OrderAmountRepository);

    await expect(
      service.previewAmount({
        items: [{ productPoolItemId: 'pool-item-001', quantity: 0 }]
      })
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.listAmountItemsByIds).not.toHaveBeenCalled();
  });

  it('rejects missing product pool items', async () => {
    const repository = createRepositoryMock();
    repository.listAmountItemsByIds.mockResolvedValue([]);
    const service = new OrderAmountService(repository as unknown as OrderAmountRepository);

    await expect(
      service.previewAmount({
        items: [{ productPoolItemId: 'pool-item-missing', quantity: 1 }]
      })
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
