import { OrderRefundRepository } from '../../src/order/order-refund.repository';

const refundRecord = {
  id: 'refund-001',
  refundNo: 'REF-20260603-001',
  requestId: 'refund-request-001',
  paymentNo: 'PAY-20260603-001',
  orderNo: 'ORDER-20260603-001',
  status: 'processing',
  channel: 'wechat',
  refundAmount: 5000,
  reason: 'user_cancel',
  providerRefundNo: null,
  succeededAt: null,
  createdAt: new Date('2026-06-03T00:10:00.000Z'),
  updatedAt: new Date('2026-06-03T00:10:00.000Z')
};

function createPrismaMock() {
  const tx = {
    orderRefund: {
      findUnique: jest.fn().mockResolvedValue(refundRecord),
      update: jest.fn().mockResolvedValue({
        ...refundRecord,
        status: 'succeeded',
        providerRefundNo: 'wx-refund-001',
        succeededAt: new Date('2026-06-03T00:15:00.000Z')
      })
    },
    orderRefundCallback: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({
        id: 'refund-callback-001',
        refundId: 'refund-001',
        refundNo: 'REF-20260603-001',
        providerEventId: 'refund-event-001',
        providerRefundNo: 'wx-refund-001',
        status: 'succeeded',
        payload: { event: 'refund.succeeded' },
        createdAt: new Date('2026-06-03T00:15:00.000Z')
      })
    },
    orderState: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'order-state-001',
        orderNo: 'ORDER-20260603-001',
        status: 'refund_processing',
        paidAt: new Date('2026-06-03T00:05:00.000Z'),
        refundRequestedAt: new Date('2026-06-03T00:10:00.000Z'),
        refundedAt: null,
        createdAt: new Date('2026-06-03T00:00:00.000Z'),
        updatedAt: new Date('2026-06-03T00:10:00.000Z')
      }),
      update: jest.fn().mockResolvedValue({
        id: 'order-state-001',
        orderNo: 'ORDER-20260603-001',
        status: 'refunded',
        paidAt: new Date('2026-06-03T00:05:00.000Z'),
        refundRequestedAt: new Date('2026-06-03T00:10:00.000Z'),
        refundedAt: new Date('2026-06-03T00:15:00.000Z'),
        createdAt: new Date('2026-06-03T00:00:00.000Z'),
        updatedAt: new Date('2026-06-03T00:15:00.000Z')
      })
    }
  };
  const prisma = {
    orderRefund: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(refundRecord)
    },
    orderState: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'order-state-001',
        orderNo: 'ORDER-20260603-001',
        status: 'paid',
        paidAt: new Date('2026-06-03T00:05:00.000Z'),
        refundRequestedAt: null,
        refundedAt: null,
        createdAt: new Date('2026-06-03T00:00:00.000Z'),
        updatedAt: new Date('2026-06-03T00:05:00.000Z')
      }),
      update: jest.fn().mockResolvedValue({
        id: 'order-state-001',
        orderNo: 'ORDER-20260603-001',
        status: 'refund_processing',
        paidAt: new Date('2026-06-03T00:05:00.000Z'),
        refundRequestedAt: new Date('2026-06-03T00:10:00.000Z'),
        refundedAt: null,
        createdAt: new Date('2026-06-03T00:00:00.000Z'),
        updatedAt: new Date('2026-06-03T00:10:00.000Z')
      })
    },
    $transaction: jest.fn(async (callback) => callback(tx))
  };

  return { prisma, tx };
}

describe('OrderRefundRepository', () => {
  it('creates a processing refund order', async () => {
    const { prisma } = createPrismaMock();
    const repository = new OrderRefundRepository(prisma as never);

    const result = await repository.createRefund({
      refundNo: 'REF-20260603-001',
      requestId: 'refund-request-001',
      paymentNo: 'PAY-20260603-001',
      orderNo: 'ORDER-20260603-001',
      channel: 'wechat',
      refundAmount: 5000,
      reason: 'user_cancel'
    });

    expect(prisma.orderRefund.create).toHaveBeenCalledWith({
      data: {
        refundNo: 'REF-20260603-001',
        requestId: 'refund-request-001',
        paymentNo: 'PAY-20260603-001',
        orderNo: 'ORDER-20260603-001',
        status: 'processing',
        channel: 'wechat',
        refundAmount: 5000,
        reason: 'user_cancel'
      },
      select: expect.any(Object)
    });
    expect(prisma.orderState.update).toHaveBeenCalledWith({
      where: { orderNo: 'ORDER-20260603-001' },
      data: {
        status: 'refund_processing',
        refundRequestedAt: expect.any(Date)
      },
      select: expect.any(Object)
    });
    expect(result).toEqual(refundRecord);
  });

  it('marks a refund succeeded on the first succeeded callback event', async () => {
    const { prisma, tx } = createPrismaMock();
    const repository = new OrderRefundRepository(prisma as never);

    const result = await repository.processCallback({
      providerEventId: 'refund-event-001',
      refundNo: 'REF-20260603-001',
      providerRefundNo: 'wx-refund-001',
      status: 'succeeded',
      succeededAt: new Date('2026-06-03T00:15:00.000Z'),
      payload: { event: 'refund.succeeded' }
    });

    expect(tx.orderRefundCallback.create).toHaveBeenCalledWith({
      data: {
        refundId: 'refund-001',
        refundNo: 'REF-20260603-001',
        providerEventId: 'refund-event-001',
        providerRefundNo: 'wx-refund-001',
        status: 'succeeded',
        payload: { event: 'refund.succeeded' }
      },
      select: expect.any(Object)
    });
    expect(tx.orderRefund.update).toHaveBeenCalledWith({
      where: { id: 'refund-001' },
      data: {
        status: 'succeeded',
        providerRefundNo: 'wx-refund-001',
        succeededAt: new Date('2026-06-03T00:15:00.000Z')
      },
      select: expect.any(Object)
    });
    expect(tx.orderState.update).toHaveBeenCalledWith({
      where: { orderNo: 'ORDER-20260603-001' },
      data: {
        status: 'refunded',
        refundedAt: new Date('2026-06-03T00:15:00.000Z')
      },
      select: expect.any(Object)
    });
    expect(result).toEqual(
      expect.objectContaining({
        duplicate: false,
        refund: expect.objectContaining({ status: 'succeeded', providerRefundNo: 'wx-refund-001' })
      })
    );
  });

  it('returns the existing refund callback result without updating refund again', async () => {
    const { prisma, tx } = createPrismaMock();
    tx.orderRefundCallback.findUnique.mockResolvedValue({
      id: 'refund-callback-001',
      refundId: 'refund-001',
      refundNo: 'REF-20260603-001',
      providerEventId: 'refund-event-001',
      providerRefundNo: 'wx-refund-001',
      status: 'succeeded',
      payload: { event: 'refund.succeeded' },
      createdAt: new Date('2026-06-03T00:15:00.000Z'),
      refund: { ...refundRecord, status: 'succeeded', providerRefundNo: 'wx-refund-001' }
    });
    const repository = new OrderRefundRepository(prisma as never);

    const result = await repository.processCallback({
      providerEventId: 'refund-event-001',
      refundNo: 'REF-20260603-001',
      providerRefundNo: 'wx-refund-001',
      status: 'succeeded',
      succeededAt: new Date('2026-06-03T00:15:00.000Z'),
      payload: { event: 'refund.succeeded' }
    });

    expect(tx.orderRefundCallback.create).not.toHaveBeenCalled();
    expect(tx.orderRefund.update).not.toHaveBeenCalled();
    expect(tx.orderState.update).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        duplicate: true,
        refund: expect.objectContaining({ status: 'succeeded', providerRefundNo: 'wx-refund-001' })
      })
    );
  });
});
