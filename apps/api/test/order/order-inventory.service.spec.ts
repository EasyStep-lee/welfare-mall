import { OrderInventoryRepository } from '../../src/order/order-inventory.repository';
import { OrderInventoryService } from '../../src/order/order-inventory.service';

function createRepositoryMock() {
  return {
    listReservations: jest.fn().mockResolvedValue({
      reservations: [
        {
          id: 'reservation-001',
          orderNo: 'ORDER-001',
          productId: 'product-001',
          merchantId: 'merchant-001',
          quantity: 2,
          status: 'reserved'
        }
      ]
    }),
    listStocks: jest.fn().mockResolvedValue({
      stocks: [
        {
          id: 'stock-001',
          stockKey: 'product-001:sku-001',
          productId: 'product-001',
          skuId: 'sku-001',
          merchantId: 'merchant-001',
          availableQuantity: 99,
          reservedQuantity: 1
        }
      ]
    })
  };
}

describe('OrderInventoryService', () => {
  it('normalizes optional filters before listing reservations', async () => {
    const repository = createRepositoryMock();
    const service = new OrderInventoryService(repository as unknown as OrderInventoryRepository);

    const result = await service.listReservations({
      status: ' reserved ',
      merchantId: ' merchant-001 ',
      orderNo: ' '
    });

    expect(repository.listReservations).toHaveBeenCalledWith({
      status: 'reserved',
      merchantId: 'merchant-001',
      orderNo: undefined
    });
    expect(result.reservations).toHaveLength(1);
  });

  it('normalizes optional filters before listing stock balances', async () => {
    const repository = createRepositoryMock();
    const service = new OrderInventoryService(repository as unknown as OrderInventoryRepository);

    const result = await service.listStocks({
      merchantId: ' merchant-001 ',
      productId: ' product-001 ',
      skuId: ' '
    });

    expect(repository.listStocks).toHaveBeenCalledWith({
      merchantId: 'merchant-001',
      productId: 'product-001',
      skuId: undefined
    });
    expect(result.stocks).toHaveLength(1);
  });
});
