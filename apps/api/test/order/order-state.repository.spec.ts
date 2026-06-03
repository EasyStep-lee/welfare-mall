import { OrderStateRepository } from '../../src/order/order-state.repository';

const orderStateRecord = {
  id: 'order-state-001',
  orderNo: 'ORDER-20260603-001',
  status: 'pending_payment',
  paidAt: null,
  refundRequestedAt: null,
  refundedAt: null,
  createdAt: new Date('2026-06-03T00:00:00.000Z'),
  updatedAt: new Date('2026-06-03T00:00:00.000Z')
};

function createPrismaMock() {
  return {
    orderState: {
      upsert: jest.fn().mockResolvedValue(orderStateRecord),
      findUnique: jest.fn().mockResolvedValue(orderStateRecord),
      update: jest.fn().mockResolvedValue({ ...orderStateRecord, status: 'paid' })
    }
  };
}

describe('OrderStateRepository', () => {
  it('upserts a pending payment order state without overwriting an existing order', async () => {
    const prisma = createPrismaMock();
    const repository = new OrderStateRepository(prisma as never);

    const result = await repository.ensurePendingPayment('ORDER-20260603-001');

    expect(prisma.orderState.upsert).toHaveBeenCalledWith({
      where: { orderNo: 'ORDER-20260603-001' },
      create: {
        orderNo: 'ORDER-20260603-001',
        status: 'pending_payment'
      },
      update: {},
      select: expect.any(Object)
    });
    expect(result).toEqual(orderStateRecord);
  });

  it('transitions an order only when the current state allows the requested action', async () => {
    const prisma = createPrismaMock();
    const repository = new OrderStateRepository(prisma as never);
    const paidAt = new Date('2026-06-03T00:05:00.000Z');

    const result = await repository.applySystemTransition({
      orderNo: 'ORDER-20260603-001',
      action: 'pay',
      paidAt
    });

    expect(prisma.orderState.findUnique).toHaveBeenCalledWith({
      where: { orderNo: 'ORDER-20260603-001' },
      select: expect.any(Object)
    });
    expect(prisma.orderState.update).toHaveBeenCalledWith({
      where: { orderNo: 'ORDER-20260603-001' },
      data: {
        status: 'paid',
        paidAt
      },
      select: expect.any(Object)
    });
    expect(result).toEqual(expect.objectContaining({ status: 'paid' }));
  });

  it('returns null without update when the order state is missing', async () => {
    const prisma = createPrismaMock();
    prisma.orderState.findUnique.mockResolvedValue(null);
    const repository = new OrderStateRepository(prisma as never);

    const result = await repository.applySystemTransition({
      orderNo: 'ORDER-MISSING',
      action: 'pay'
    });

    expect(prisma.orderState.update).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
