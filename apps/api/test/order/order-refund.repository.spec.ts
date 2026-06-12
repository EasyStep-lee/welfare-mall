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
    },
    orderHeader: {
      findUnique: jest.fn().mockResolvedValue({
        orderNo: 'ORDER-20260603-001',
        buyerUserId: 'user-local-001',
        salesFranchiseId: 'franchise-local-review'
      }),
      update: jest.fn().mockResolvedValue({
        orderNo: 'ORDER-20260603-001',
        status: 'refunded'
      })
    },
    orderPayment: {
      findUnique: jest.fn().mockResolvedValue({
        paymentNo: 'PAY-20260603-001',
        orderNo: 'ORDER-20260603-001',
        welfareCardPayableAmount: 1000
      })
    },
    orderPaymentComponent: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'payment-component-welfare-001',
          paymentNo: 'PAY-20260603-001',
          orderNo: 'ORDER-20260603-001',
          sequenceNo: 1,
          componentType: 'welfare_card',
          channel: 'welfare_card',
          welfareCardAccountId: 'welfare-card-account-001',
          franchiseId: 'franchise-local-review',
          buyerUserId: 'user-local-001',
          amount: 1000,
          status: 'pending'
        },
        {
          id: 'payment-component-online-001',
          paymentNo: 'PAY-20260603-001',
          orderNo: 'ORDER-20260603-001',
          sequenceNo: 2,
          componentType: 'online_cash',
          channel: 'wechat',
          welfareCardAccountId: null,
          franchiseId: 'franchise-local-review',
          buyerUserId: 'user-local-001',
          amount: 4000,
          status: 'pending'
        }
      ])
    },
    orderRefundComponent: {
      createMany: jest.fn().mockResolvedValue({ count: 2 })
    },
    welfareCardAccount: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'welfare-card-account-001',
        accountNo: 'WCA-LOCAL-001',
        franchiseId: 'franchise-local-review',
        buyerUserId: 'user-local-001',
        status: 'active',
        balanceAmount: 4000,
        issuedAmount: 10000,
        createdAt: new Date('2026-06-03T00:00:00.000Z'),
        updatedAt: new Date('2026-06-03T00:00:00.000Z')
      }),
      update: jest.fn().mockResolvedValue({
        id: 'welfare-card-account-001',
        accountNo: 'WCA-LOCAL-001',
        franchiseId: 'franchise-local-review',
        buyerUserId: 'user-local-001',
        status: 'active',
        balanceAmount: 5000,
        issuedAmount: 10000,
        createdAt: new Date('2026-06-03T00:00:00.000Z'),
        updatedAt: new Date('2026-06-03T00:15:00.000Z')
      })
    },
    welfareCardLedgerEntry: {
      create: jest.fn().mockResolvedValue({
        id: 'welfare-card-ledger-refund-001'
      })
    },
    inventoryReservation: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'reservation-001',
          orderNo: 'ORDER-20260603-001',
          orderLineId: 'order-line-001',
          productId: 'product-001',
          skuId: 'sku-001',
          merchantId: 'merchant-001',
          quantity: 2,
          status: 'reserved',
          source: 'order_checkout',
          releasedAt: null,
          createdAt: new Date('2026-06-03T00:05:00.000Z'),
          updatedAt: new Date('2026-06-03T00:05:00.000Z')
        }
      ]),
      updateMany: jest.fn().mockResolvedValue({ count: 1 })
    },
    inventoryStock: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 })
    }
  };
  const prisma = {
    orderRefund: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(refundRecord),
      update: jest.fn().mockResolvedValue({
        ...refundRecord,
        providerRefundNo: 'wx-refund-001'
      })
    },
    orderPayment: {
      findUnique: jest.fn().mockResolvedValue({
        paymentNo: 'PAY-20260603-001',
        orderNo: 'ORDER-20260603-001',
        channel: 'wechat',
        status: 'paid',
        totalAmount: 5000,
        cashPayableAmount: 4000,
        providerPaymentNo: 'wx-pay-001',
        components: [
          {
            sequenceNo: 1,
            componentType: 'welfare_card',
            channel: 'welfare_card',
            amount: 1000
          },
          {
            sequenceNo: 2,
            componentType: 'online_cash',
            channel: 'wechat',
            amount: 4000
          }
        ]
      })
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
    orderHeader: {
      update: jest.fn().mockResolvedValue({
        orderNo: 'ORDER-20260603-001',
        status: 'refund_processing'
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
    expect(prisma.orderHeader.update).toHaveBeenCalledWith({
      where: { orderNo: 'ORDER-20260603-001' },
      data: { status: 'refund_processing' }
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
    expect(tx.orderHeader.update).toHaveBeenCalledWith({
      where: { orderNo: 'ORDER-20260603-001' },
      data: { status: 'refunded' }
    });
    expect(tx.inventoryReservation.findMany).toHaveBeenCalledWith({
      where: {
        orderNo: 'ORDER-20260603-001',
        status: 'reserved'
      },
      select: {
        productId: true,
        skuId: true,
        quantity: true
      }
    });
    expect(tx.inventoryReservation.updateMany).toHaveBeenCalledWith({
      where: {
        orderNo: 'ORDER-20260603-001',
        status: 'reserved'
      },
      data: {
        status: 'released',
        releasedAt: new Date('2026-06-03T00:15:00.000Z')
      }
    });
    expect(tx.inventoryStock.updateMany).toHaveBeenCalledWith({
      where: { stockKey: 'product-001:sku-001' },
      data: {
        availableQuantity: { increment: 2 },
        reservedQuantity: { decrement: 2 }
      }
    });
    expect(tx.orderPaymentComponent.findMany).toHaveBeenCalledWith({
      where: { paymentNo: 'PAY-20260603-001' },
      orderBy: { sequenceNo: 'asc' },
      select: {
        id: true,
        paymentNo: true,
        orderNo: true,
        sequenceNo: true,
        componentType: true,
        channel: true,
        welfareCardAccountId: true,
        franchiseId: true,
        buyerUserId: true,
        amount: true,
        status: true
      }
    });
    expect(tx.orderRefundComponent.createMany).toHaveBeenCalledWith({
      data: [
        {
          refundId: 'refund-001',
          refundNo: 'REF-20260603-001',
          paymentNo: 'PAY-20260603-001',
          orderNo: 'ORDER-20260603-001',
          sequenceNo: 1,
          componentType: 'welfare_card',
          channel: 'welfare_card',
          paymentComponentId: 'payment-component-welfare-001',
          welfareCardAccountId: 'welfare-card-account-001',
          franchiseId: 'franchise-local-review',
          buyerUserId: 'user-local-001',
          amount: 1000,
          status: 'succeeded',
          providerRefundNo: null
        },
        {
          refundId: 'refund-001',
          refundNo: 'REF-20260603-001',
          paymentNo: 'PAY-20260603-001',
          orderNo: 'ORDER-20260603-001',
          sequenceNo: 2,
          componentType: 'online_cash',
          channel: 'wechat',
          paymentComponentId: 'payment-component-online-001',
          welfareCardAccountId: null,
          franchiseId: 'franchise-local-review',
          buyerUserId: 'user-local-001',
          amount: 4000,
          status: 'succeeded',
          providerRefundNo: 'wx-refund-001'
        }
      ]
    });
    expect(tx.welfareCardAccount.findUnique).toHaveBeenCalledWith({
      where: { id: 'welfare-card-account-001' },
      select: expect.any(Object)
    });
    expect(tx.welfareCardAccount.update).toHaveBeenCalledWith({
      where: { id: 'welfare-card-account-001' },
      data: {
        balanceAmount: { increment: 1000 }
      },
      select: expect.any(Object)
    });
    expect(tx.welfareCardLedgerEntry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ledgerNo: 'WCL-REFUND-refund-request-001',
        requestId: 'refund:refund-request-001',
        accountId: 'welfare-card-account-001',
        franchiseId: 'franchise-local-review',
        buyerUserId: 'user-local-001',
        type: 'refund',
        amount: 1000,
        balanceAfter: 5000,
        orderNo: 'ORDER-20260603-001'
      }),
      select: { id: true }
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
    expect(tx.orderHeader.update).not.toHaveBeenCalled();
    expect(tx.inventoryReservation.findMany).not.toHaveBeenCalled();
    expect(tx.inventoryReservation.updateMany).not.toHaveBeenCalled();
    expect(tx.inventoryStock.updateMany).not.toHaveBeenCalled();
    expect(tx.orderPayment.findUnique).not.toHaveBeenCalled();
    expect(tx.orderPaymentComponent.findMany).not.toHaveBeenCalled();
    expect(tx.orderRefundComponent.createMany).not.toHaveBeenCalled();
    expect(tx.welfareCardAccount.update).not.toHaveBeenCalled();
    expect(tx.welfareCardLedgerEntry.create).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        duplicate: true,
        refund: expect.objectContaining({ status: 'succeeded', providerRefundNo: 'wx-refund-001' })
      })
    );
  });

  it('does not credit welfare card when the original payment has no welfare card amount', async () => {
    const { prisma, tx } = createPrismaMock();
    tx.orderPaymentComponent.findMany.mockResolvedValue([
      {
        id: 'payment-component-online-001',
        paymentNo: 'PAY-20260603-001',
        orderNo: 'ORDER-20260603-001',
        sequenceNo: 1,
        componentType: 'online_cash',
        channel: 'wechat',
        welfareCardAccountId: null,
        franchiseId: 'franchise-local-review',
        buyerUserId: 'user-local-001',
        amount: 5000,
        status: 'pending'
      }
    ]);
    const repository = new OrderRefundRepository(prisma as never);

    await repository.processCallback({
      providerEventId: 'refund-event-cash-only-001',
      refundNo: 'REF-20260603-001',
      providerRefundNo: 'wx-refund-001',
      status: 'succeeded',
      succeededAt: new Date('2026-06-03T00:15:00.000Z'),
      payload: { event: 'refund.succeeded' }
    });

    expect(tx.orderPaymentComponent.findMany).toHaveBeenCalledWith({
      where: { paymentNo: 'PAY-20260603-001' },
      orderBy: { sequenceNo: 'asc' },
      select: {
        id: true,
        paymentNo: true,
        orderNo: true,
        sequenceNo: true,
        componentType: true,
        channel: true,
        welfareCardAccountId: true,
        franchiseId: true,
        buyerUserId: true,
        amount: true,
        status: true
      }
    });
    expect(tx.orderRefundComponent.createMany).toHaveBeenCalledWith({
      data: [
        {
          refundId: 'refund-001',
          refundNo: 'REF-20260603-001',
          paymentNo: 'PAY-20260603-001',
          orderNo: 'ORDER-20260603-001',
          sequenceNo: 1,
          componentType: 'online_cash',
          channel: 'wechat',
          paymentComponentId: 'payment-component-online-001',
          welfareCardAccountId: null,
          franchiseId: 'franchise-local-review',
          buyerUserId: 'user-local-001',
          amount: 5000,
          status: 'succeeded',
          providerRefundNo: 'wx-refund-001'
        }
      ]
    });
    expect(tx.orderHeader.findUnique).not.toHaveBeenCalled();
    expect(tx.welfareCardAccount.findUnique).not.toHaveBeenCalled();
    expect(tx.welfareCardAccount.update).not.toHaveBeenCalled();
    expect(tx.welfareCardLedgerEntry.create).not.toHaveBeenCalled();
  });

  it('does not credit welfare card again when a new callback arrives after refund already succeeded', async () => {
    const { prisma, tx } = createPrismaMock();
    tx.orderRefund.findUnique.mockResolvedValue({
      ...refundRecord,
      status: 'succeeded',
      providerRefundNo: 'wx-refund-001',
      succeededAt: new Date('2026-06-03T00:15:00.000Z')
    });
    const repository = new OrderRefundRepository(prisma as never);

    const result = await repository.processCallback({
      providerEventId: 'refund-event-late-001',
      refundNo: 'REF-20260603-001',
      providerRefundNo: 'wx-refund-001',
      status: 'succeeded',
      succeededAt: new Date('2026-06-03T00:16:00.000Z'),
      payload: { event: 'refund.succeeded' }
    });

    expect(tx.orderPayment.findUnique).not.toHaveBeenCalled();
    expect(tx.orderPaymentComponent.findMany).not.toHaveBeenCalled();
    expect(tx.orderRefundComponent.createMany).not.toHaveBeenCalled();
    expect(tx.welfareCardAccount.update).not.toHaveBeenCalled();
    expect(tx.welfareCardLedgerEntry.create).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        duplicate: false,
        refund: expect.objectContaining({ status: 'succeeded', providerRefundNo: 'wx-refund-001' })
      })
    );
  });

  it('marks a refund failed and restores paid order header status', async () => {
    const { prisma, tx } = createPrismaMock();
    tx.orderRefund.update.mockResolvedValue({
      ...refundRecord,
      status: 'failed',
      providerRefundNo: 'wx-refund-001'
    });
    tx.orderState.update.mockResolvedValue({
      id: 'order-state-001',
      orderNo: 'ORDER-20260603-001',
      status: 'paid',
      paidAt: new Date('2026-06-03T00:05:00.000Z'),
      refundRequestedAt: new Date('2026-06-03T00:10:00.000Z'),
      refundedAt: null,
      createdAt: new Date('2026-06-03T00:00:00.000Z'),
      updatedAt: new Date('2026-06-03T00:15:00.000Z')
    });
    const repository = new OrderRefundRepository(prisma as never);

    const result = await repository.processCallback({
      providerEventId: 'refund-event-failed-001',
      refundNo: 'REF-20260603-001',
      providerRefundNo: 'wx-refund-001',
      status: 'failed',
      succeededAt: null,
      payload: { event: 'refund.failed' }
    });

    expect(tx.orderRefund.update).toHaveBeenCalledWith({
      where: { id: 'refund-001' },
      data: {
        status: 'failed',
        providerRefundNo: 'wx-refund-001'
      },
      select: expect.any(Object)
    });
    expect(tx.orderState.update).toHaveBeenCalledWith({
      where: { orderNo: 'ORDER-20260603-001' },
      data: { status: 'paid' },
      select: expect.any(Object)
    });
    expect(tx.orderHeader.update).toHaveBeenCalledWith({
      where: { orderNo: 'ORDER-20260603-001' },
      data: { status: 'paid' }
    });
    expect(tx.inventoryReservation.findMany).not.toHaveBeenCalled();
    expect(tx.inventoryReservation.updateMany).not.toHaveBeenCalled();
    expect(tx.inventoryStock.updateMany).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        duplicate: false,
        refund: expect.objectContaining({ status: 'failed', providerRefundNo: 'wx-refund-001' })
      })
    );
  });

  it('reads refund provider context from the original paid payment and components', async () => {
    const { prisma } = createPrismaMock();
    const repository = new OrderRefundRepository(prisma as never);

    const result = await repository.findRefundProviderContext('PAY-20260603-001');

    expect(prisma.orderPayment.findUnique).toHaveBeenCalledWith({
      where: { paymentNo: 'PAY-20260603-001' },
      select: {
        paymentNo: true,
        orderNo: true,
        channel: true,
        status: true,
        totalAmount: true,
        cashPayableAmount: true,
        providerPaymentNo: true,
        components: {
          orderBy: { sequenceNo: 'asc' },
          select: {
            sequenceNo: true,
            componentType: true,
            channel: true,
            amount: true
          }
        }
      }
    });
    expect(result).toEqual({
      paymentNo: 'PAY-20260603-001',
      orderNo: 'ORDER-20260603-001',
      channel: 'wechat',
      status: 'paid',
      totalAmount: 5000,
      cashPayableAmount: 4000,
      providerPaymentNo: 'wx-pay-001',
      components: [
        {
          sequenceNo: 1,
          componentType: 'welfare_card',
          channel: 'welfare_card',
          amount: 1000
        },
        {
          sequenceNo: 2,
          componentType: 'online_cash',
          channel: 'wechat',
          amount: 4000
        }
      ]
    });
  });

  it('marks a processing refund with provider refund number after provider accepts it', async () => {
    const { prisma } = createPrismaMock();
    const repository = new OrderRefundRepository(prisma as never);

    const result = await repository.markRefundProviderInitiated({
      refundNo: 'REF-20260603-001',
      providerRefundNo: 'wx-refund-001'
    });

    expect(prisma.orderRefund.update).toHaveBeenCalledWith({
      where: { refundNo: 'REF-20260603-001' },
      data: { providerRefundNo: 'wx-refund-001' },
      select: expect.any(Object)
    });
    expect(result).toEqual(expect.objectContaining({ providerRefundNo: 'wx-refund-001' }));
  });
});
