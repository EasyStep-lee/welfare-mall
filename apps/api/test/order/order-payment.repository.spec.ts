import { OrderPaymentRepository } from '../../src/order/order-payment.repository';

const paymentRecord = {
  id: 'payment-001',
  paymentNo: 'PAY-20260603-001',
  requestId: 'request-001',
  orderNo: 'ORDER-20260603-001',
  status: 'pending',
  channel: 'wechat',
  totalAmount: 13980,
  welfareCardPayableAmount: 5000,
  cashPayableAmount: 8980,
  providerPaymentNo: null,
  paidAt: null,
  createdAt: new Date('2026-06-03T00:00:00.000Z'),
  updatedAt: new Date('2026-06-03T00:00:00.000Z')
};

function createPrismaMock() {
  const tx = {
    orderPayment: {
      findUnique: jest.fn().mockResolvedValue(paymentRecord),
      update: jest.fn().mockResolvedValue({
        ...paymentRecord,
        status: 'paid',
        providerPaymentNo: 'wx-pay-001',
        paidAt: new Date('2026-06-03T00:05:00.000Z')
      })
    },
    orderPaymentCallback: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({
        id: 'callback-001',
        paymentId: 'payment-001',
        paymentNo: 'PAY-20260603-001',
        providerEventId: 'event-001',
        providerPaymentNo: 'wx-pay-001',
        status: 'paid',
        payload: { event: 'paid' },
        createdAt: new Date('2026-06-03T00:05:00.000Z')
      })
    },
    orderState: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'order-state-001',
        orderNo: 'ORDER-20260603-001',
        status: 'pending_payment',
        paidAt: null,
        refundRequestedAt: null,
        refundedAt: null,
        createdAt: new Date('2026-06-03T00:00:00.000Z'),
        updatedAt: new Date('2026-06-03T00:00:00.000Z')
      }),
      update: jest.fn().mockResolvedValue({
        id: 'order-state-001',
        orderNo: 'ORDER-20260603-001',
        status: 'paid',
        paidAt: new Date('2026-06-03T00:05:00.000Z'),
        refundRequestedAt: null,
        refundedAt: null,
        createdAt: new Date('2026-06-03T00:00:00.000Z'),
        updatedAt: new Date('2026-06-03T00:05:00.000Z')
      })
    }
  };
  const prisma = {
    orderPayment: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(paymentRecord)
    },
    orderState: {
      upsert: jest.fn().mockResolvedValue({
        id: 'order-state-001',
        orderNo: 'ORDER-20260603-001',
        status: 'pending_payment',
        paidAt: null,
        refundRequestedAt: null,
        refundedAt: null,
        createdAt: new Date('2026-06-03T00:00:00.000Z'),
        updatedAt: new Date('2026-06-03T00:00:00.000Z')
      })
    },
    $transaction: jest.fn(async (callback) => callback(tx))
  };

  return { prisma, tx };
}

describe('OrderPaymentRepository', () => {
  it('creates a pending payment order', async () => {
    const { prisma } = createPrismaMock();
    const repository = new OrderPaymentRepository(prisma as never);

    const result = await repository.createPayment({
      paymentNo: 'PAY-20260603-001',
      requestId: 'request-001',
      orderNo: 'ORDER-20260603-001',
      channel: 'wechat',
      totalAmount: 13980,
      welfareCardPayableAmount: 5000,
      cashPayableAmount: 8980
    });

    expect(prisma.orderPayment.create).toHaveBeenCalledWith({
      data: {
        paymentNo: 'PAY-20260603-001',
        requestId: 'request-001',
        orderNo: 'ORDER-20260603-001',
        status: 'pending',
        channel: 'wechat',
        totalAmount: 13980,
        welfareCardPayableAmount: 5000,
        cashPayableAmount: 8980
      },
      select: expect.any(Object)
    });
    expect(prisma.orderState.upsert).toHaveBeenCalledWith({
      where: { orderNo: 'ORDER-20260603-001' },
      create: {
        orderNo: 'ORDER-20260603-001',
        status: 'pending_payment'
      },
      update: {},
      select: expect.any(Object)
    });
    expect(result).toEqual(paymentRecord);
  });

  it('marks a payment paid on the first paid callback event', async () => {
    const { prisma, tx } = createPrismaMock();
    const repository = new OrderPaymentRepository(prisma as never);

    const result = await repository.processCallback({
      providerEventId: 'event-001',
      paymentNo: 'PAY-20260603-001',
      providerPaymentNo: 'wx-pay-001',
      status: 'paid',
      paidAt: new Date('2026-06-03T00:05:00.000Z'),
      payload: { event: 'paid' }
    });

    expect(tx.orderPaymentCallback.create).toHaveBeenCalledWith({
      data: {
        paymentId: 'payment-001',
        paymentNo: 'PAY-20260603-001',
        providerEventId: 'event-001',
        providerPaymentNo: 'wx-pay-001',
        status: 'paid',
        payload: { event: 'paid' }
      },
      select: expect.any(Object)
    });
    expect(tx.orderPayment.update).toHaveBeenCalledWith({
      where: { id: 'payment-001' },
      data: {
        status: 'paid',
        providerPaymentNo: 'wx-pay-001',
        paidAt: new Date('2026-06-03T00:05:00.000Z')
      },
      select: expect.any(Object)
    });
    expect(tx.orderState.update).toHaveBeenCalledWith({
      where: { orderNo: 'ORDER-20260603-001' },
      data: {
        status: 'paid',
        paidAt: new Date('2026-06-03T00:05:00.000Z')
      },
      select: expect.any(Object)
    });
    expect(result).toEqual(
      expect.objectContaining({
        duplicate: false,
        payment: expect.objectContaining({ status: 'paid', providerPaymentNo: 'wx-pay-001' })
      })
    );
  });

  it('returns the existing callback result without updating payment again', async () => {
    const { prisma, tx } = createPrismaMock();
    tx.orderPaymentCallback.findUnique.mockResolvedValue({
      id: 'callback-001',
      paymentId: 'payment-001',
      paymentNo: 'PAY-20260603-001',
      providerEventId: 'event-001',
      providerPaymentNo: 'wx-pay-001',
      status: 'paid',
      payload: { event: 'paid' },
      createdAt: new Date('2026-06-03T00:05:00.000Z'),
      payment: { ...paymentRecord, status: 'paid', providerPaymentNo: 'wx-pay-001' }
    });
    const repository = new OrderPaymentRepository(prisma as never);

    const result = await repository.processCallback({
      providerEventId: 'event-001',
      paymentNo: 'PAY-20260603-001',
      providerPaymentNo: 'wx-pay-001',
      status: 'paid',
      paidAt: new Date('2026-06-03T00:05:00.000Z'),
      payload: { event: 'paid' }
    });

    expect(tx.orderPaymentCallback.create).not.toHaveBeenCalled();
    expect(tx.orderPayment.update).not.toHaveBeenCalled();
    expect(tx.orderState.update).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        duplicate: true,
        payment: expect.objectContaining({ status: 'paid', providerPaymentNo: 'wx-pay-001' })
      })
    );
  });
});
