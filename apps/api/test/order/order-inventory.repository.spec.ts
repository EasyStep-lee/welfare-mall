import { OrderInventoryRepository } from '../../src/order/order-inventory.repository';

function createPrismaMock() {
  const reservations = [
    {
      id: 'reservation-001',
      orderNo: 'ORDER-001',
      orderLineId: 'order-line-001',
      productId: 'product-001',
      skuId: 'sku-001',
      merchantId: 'merchant-001',
      quantity: 2,
      status: 'reserved',
      source: 'order_paid',
      releasedAt: null,
      createdAt: new Date('2026-06-05T00:00:00.000Z'),
      updatedAt: new Date('2026-06-05T00:00:00.000Z')
    }
  ];

  return {
    reservations,
    prisma: {
      inventoryReservation: {
        findMany: jest.fn().mockResolvedValue(reservations)
      }
    }
  };
}

describe('OrderInventoryRepository', () => {
  it('lists filtered inventory reservations for Admin read model', async () => {
    const { prisma, reservations } = createPrismaMock();
    const repository = new OrderInventoryRepository(prisma as never);

    const result = await repository.listReservations({
      status: 'reserved',
      merchantId: 'merchant-001',
      orderNo: 'ORDER-001'
    });

    expect(prisma.inventoryReservation.findMany).toHaveBeenCalledWith({
      where: {
        status: 'reserved',
        merchantId: 'merchant-001',
        orderNo: 'ORDER-001'
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    expect(result).toEqual({ reservations });
  });
});
