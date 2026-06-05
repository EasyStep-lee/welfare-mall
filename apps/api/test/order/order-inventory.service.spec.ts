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
});
