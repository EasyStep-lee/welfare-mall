import { InsufficientWelfareCardBalanceError, OrderPaymentRepository } from '../../src/order/order-payment.repository';

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

const paidOrderRecord = {
  orderNo: 'ORDER-20260603-001',
  fulfillmentType: 'delivery',
  receiverName: 'Li Lei',
  receiverPhone: '13800000000',
  receiverAddress: 'Pudong Avenue 1',
  pickupStoreName: null,
  lines: [
    {
      id: 'order-line-001',
      productId: 'product-001',
      skuId: 'sku-001',
      displayName: 'Local Rice',
      displaySkuCode: 'SKU-RICE-5KG',
      displayImageUrl: 'https://cdn.example.com/rice.jpg',
      unitPriceAmount: 6990,
      quantity: 2,
      lineTotalAmount: 13980
    }
  ]
};

const pickupOrderRecord = {
  ...paidOrderRecord,
  fulfillmentType: 'pickup',
  receiverName: null,
  receiverPhone: null,
  receiverAddress: null,
  pickupStoreName: '浦东直营网点'
};

function createPrismaMock() {
  const tx = {
    product: {
      findMany: jest.fn().mockResolvedValue([{ id: 'product-001', merchantId: 'merchant-001' }])
    },
    orderHeader: {
      findUnique: jest.fn().mockResolvedValue(paidOrderRecord),
      update: jest.fn().mockResolvedValue({
        orderNo: 'ORDER-20260603-001',
        status: 'paid'
      })
    },
    orderPayment: {
      create: jest.fn().mockResolvedValue(paymentRecord),
      findUnique: jest.fn().mockResolvedValue(paymentRecord),
      update: jest.fn().mockResolvedValue({
        ...paymentRecord,
        status: 'paid',
        providerPaymentNo: 'wx-pay-001',
        paidAt: new Date('2026-06-03T00:05:00.000Z')
      })
    },
    orderPaymentComponent: {
      createMany: jest.fn().mockResolvedValue({ count: 2 })
    },
    welfareCardAccount: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'wca-001',
        accountNo: 'WCA-franchise-local-review-buyer-local',
        franchiseId: 'franchise-local-review',
        buyerUserId: 'buyer-local',
        status: 'active',
        balanceAmount: 10000,
        issuedAmount: 10000,
        createdAt: new Date('2026-06-03T00:00:00.000Z'),
        updatedAt: new Date('2026-06-03T00:00:00.000Z')
      }),
      update: jest.fn().mockResolvedValue({
        id: 'wca-001',
        accountNo: 'WCA-franchise-local-review-buyer-local',
        franchiseId: 'franchise-local-review',
        buyerUserId: 'buyer-local',
        status: 'active',
        balanceAmount: 5000,
        issuedAmount: 10000,
        createdAt: new Date('2026-06-03T00:00:00.000Z'),
        updatedAt: new Date('2026-06-03T00:01:00.000Z')
      })
    },
    welfareCardLedgerEntry: {
      create: jest.fn().mockResolvedValue({
        id: 'wcl-payment-001',
        ledgerNo: 'WCL-PAYMENT-request-001',
        requestId: 'payment:request-001',
        accountId: 'wca-001',
        franchiseId: 'franchise-local-review',
        buyerUserId: 'buyer-local',
        type: 'payment',
        amount: -5000,
        balanceAfter: 5000,
        orderNo: 'ORDER-20260603-001',
        remark: null,
        createdAt: new Date('2026-06-03T00:01:00.000Z')
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
      upsert: jest.fn().mockResolvedValue({
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
    },
    fulfillmentTask: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({
        id: 'fulfillment-task-001',
        taskNo: 'FT-ORDER-20260603-001-MERCHANT-001',
        orderNo: 'ORDER-20260603-001',
        merchantId: 'merchant-001',
        status: 'pending'
      })
    },
    inventoryReservation: {
      createMany: jest.fn().mockResolvedValue({ count: 1 })
    }
  };
  const prisma = {
    $transaction: jest.fn(async (callback) => callback(tx)),
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
    }
  };

  return { prisma, tx };
}

describe('OrderPaymentRepository', () => {
  it('creates a pending payment order', async () => {
    const { prisma } = createPrismaMock();
    const cashOnlyPaymentRecord = {
      ...paymentRecord,
      welfareCardPayableAmount: 0,
      cashPayableAmount: 13980
    };
    const paymentTx = {
      orderPayment: {
        create: jest.fn().mockResolvedValue(cashOnlyPaymentRecord)
      },
      orderPaymentComponent: {
        createMany: jest.fn().mockResolvedValue({ count: 1 })
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
      }
    };
    prisma.$transaction.mockImplementationOnce(async (callback) => callback(paymentTx));
    const repository = new OrderPaymentRepository(prisma as never);

    const result = await repository.createPayment({
      paymentNo: 'PAY-20260603-001',
      requestId: 'request-001',
      orderNo: 'ORDER-20260603-001',
      channel: 'wechat',
      totalAmount: 13980,
      welfareCardPayableAmount: 0,
      cashPayableAmount: 13980
    });

    expect(paymentTx.orderPayment.create).toHaveBeenCalledWith({
      data: {
        paymentNo: 'PAY-20260603-001',
        requestId: 'request-001',
        orderNo: 'ORDER-20260603-001',
        status: 'pending',
        channel: 'wechat',
        totalAmount: 13980,
        welfareCardPayableAmount: 0,
        cashPayableAmount: 13980
      },
      select: expect.any(Object)
    });
    expect(paymentTx.orderPaymentComponent.createMany).toHaveBeenCalledWith({
      data: [
        {
          paymentId: 'payment-001',
          paymentNo: 'PAY-20260603-001',
          orderNo: 'ORDER-20260603-001',
          sequenceNo: 1,
          componentType: 'online_cash',
          channel: 'wechat',
          welfareCardAccountId: null,
          franchiseId: null,
          buyerUserId: null,
          amount: 13980,
          status: 'pending'
        }
      ],
      skipDuplicates: true
    });
    expect(paymentTx.orderState.upsert).toHaveBeenCalledWith({
      where: { orderNo: 'ORDER-20260603-001' },
      create: {
        orderNo: 'ORDER-20260603-001',
        status: 'pending_payment'
      },
      update: {},
      select: expect.any(Object)
    });
    expect(result).toEqual(cashOnlyPaymentRecord);
  });

  it('debits the sales franchise welfare card account when creating a mixed payment', async () => {
    const { prisma, tx } = createPrismaMock();
    tx.orderHeader.findUnique.mockResolvedValue({
      orderNo: 'ORDER-20260603-001',
      buyerUserId: 'buyer-local',
      lines: [
        {
          productId: 'product-001'
        }
      ]
    });
    tx.product.findMany.mockResolvedValue([{ id: 'product-001', franchiseId: 'franchise-local-review' }]);
    tx.orderPayment.create = jest.fn().mockResolvedValue(paymentRecord);
    tx.orderState.upsert = jest.fn().mockResolvedValue({
      id: 'order-state-001',
      orderNo: 'ORDER-20260603-001',
      status: 'pending_payment',
      paidAt: null,
      refundRequestedAt: null,
      refundedAt: null,
      createdAt: new Date('2026-06-03T00:00:00.000Z'),
      updatedAt: new Date('2026-06-03T00:00:00.000Z')
    });
    const repository = new OrderPaymentRepository(prisma as never);

    await repository.createPayment({
      paymentNo: 'PAY-20260603-001',
      requestId: 'request-001',
      orderNo: 'ORDER-20260603-001',
      channel: 'wechat',
      totalAmount: 13980,
      welfareCardPayableAmount: 5000,
      cashPayableAmount: 8980,
      welfareCardAccountId: 'wca-001'
    });

    expect(tx.orderHeader.findUnique).toHaveBeenCalledWith({
      where: { orderNo: 'ORDER-20260603-001' },
      select: expect.objectContaining({
        buyerUserId: true,
        lines: expect.any(Object)
      })
    });
    expect(tx.product.findMany).toHaveBeenCalledWith({
      where: { id: { in: ['product-001'] } },
      select: { id: true, franchiseId: true }
    });
    expect(tx.welfareCardAccount.findUnique).toHaveBeenCalledWith({
      where: {
        id: 'wca-001'
      },
      select: expect.any(Object)
    });
    expect(tx.welfareCardAccount.update).toHaveBeenCalledWith({
      where: { id: 'wca-001' },
      data: { balanceAmount: { decrement: 5000 } },
      select: expect.any(Object)
    });
    expect(tx.orderPaymentComponent.createMany).toHaveBeenCalledWith({
      data: [
        {
          paymentId: 'payment-001',
          paymentNo: 'PAY-20260603-001',
          orderNo: 'ORDER-20260603-001',
          sequenceNo: 1,
          componentType: 'welfare_card',
          channel: 'welfare_card',
          welfareCardAccountId: 'wca-001',
          franchiseId: 'franchise-local-review',
          buyerUserId: 'buyer-local',
          amount: 5000,
          status: 'pending'
        },
        {
          paymentId: 'payment-001',
          paymentNo: 'PAY-20260603-001',
          orderNo: 'ORDER-20260603-001',
          sequenceNo: 2,
          componentType: 'online_cash',
          channel: 'wechat',
          welfareCardAccountId: null,
          franchiseId: 'franchise-local-review',
          buyerUserId: 'buyer-local',
          amount: 8980,
          status: 'pending'
        }
      ],
      skipDuplicates: true
    });
    expect(tx.welfareCardLedgerEntry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        requestId: 'payment:request-001',
        accountId: 'wca-001',
        franchiseId: 'franchise-local-review',
        buyerUserId: 'buyer-local',
        type: 'payment',
        amount: -5000,
        balanceAfter: 5000,
        orderNo: 'ORDER-20260603-001'
      }),
      select: expect.any(Object)
    });
  });

  it('rejects welfare-card payment when the franchise card balance is insufficient', async () => {
    const { prisma, tx } = createPrismaMock();
    tx.orderHeader.findUnique.mockResolvedValue({
      orderNo: 'ORDER-20260603-001',
      buyerUserId: 'buyer-local',
      lines: [
        {
          productId: 'product-001'
        }
      ]
    });
    tx.product.findMany.mockResolvedValue([{ id: 'product-001', franchiseId: 'franchise-local-review' }]);
    tx.welfareCardAccount.findUnique.mockResolvedValue({
      id: 'wca-001',
      accountNo: 'WCA-franchise-local-review-buyer-local',
      franchiseId: 'franchise-local-review',
      buyerUserId: 'buyer-local',
      status: 'active',
      balanceAmount: 1000,
      issuedAmount: 10000,
      createdAt: new Date('2026-06-03T00:00:00.000Z'),
      updatedAt: new Date('2026-06-03T00:00:00.000Z')
    });
    tx.orderPayment.create = jest.fn().mockResolvedValue(paymentRecord);
    tx.orderState.upsert = jest.fn();
    const repository = new OrderPaymentRepository(prisma as never);

    await expect(
      repository.createPayment({
        paymentNo: 'PAY-20260603-001',
        requestId: 'request-001',
        orderNo: 'ORDER-20260603-001',
        channel: 'wechat',
        totalAmount: 13980,
      welfareCardPayableAmount: 5000,
      cashPayableAmount: 8980,
      welfareCardAccountId: 'wca-001'
      })
    ).rejects.toBeInstanceOf(InsufficientWelfareCardBalanceError);

    expect(tx.welfareCardAccount.update).not.toHaveBeenCalled();
    expect(tx.welfareCardLedgerEntry.create).not.toHaveBeenCalled();
    expect(tx.orderPaymentComponent.createMany).not.toHaveBeenCalled();
    expect(tx.orderPayment.create).not.toHaveBeenCalled();
    expect(tx.orderState.upsert).not.toHaveBeenCalled();
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
    expect(tx.orderHeader.update).toHaveBeenCalledWith({
      where: { orderNo: 'ORDER-20260603-001' },
      data: { status: 'paid' }
    });
    expect(tx.fulfillmentTask.create).toHaveBeenCalledWith({
      data: {
        taskNo: expect.stringMatching(/^FT-ORDER-20260603-001-MERCHANT-001-\d+$/),
        orderNo: 'ORDER-20260603-001',
        merchantId: 'merchant-001',
        status: 'pending',
        fulfillmentType: 'delivery',
        receiverName: 'Li Lei',
        receiverPhone: '13800000000',
        receiverAddress: 'Pudong Avenue 1',
        pickupStoreName: null,
        pickupCode: null,
        lines: {
          create: [
            {
              orderLineId: 'order-line-001',
              productId: 'product-001',
              skuId: 'sku-001',
              displayName: 'Local Rice',
              displaySkuCode: 'SKU-RICE-5KG',
              displayImageUrl: 'https://cdn.example.com/rice.jpg',
              unitPriceAmount: 6990,
              quantity: 2,
              lineTotalAmount: 13980
            }
          ]
        }
      },
      select: expect.any(Object)
    });
    expect(tx.inventoryReservation.createMany).toHaveBeenCalledWith({
      data: [
        {
          orderNo: 'ORDER-20260603-001',
          orderLineId: 'order-line-001',
          productId: 'product-001',
          skuId: 'sku-001',
          merchantId: 'merchant-001',
          quantity: 2,
          status: 'reserved',
          source: 'order_paid'
        }
      ],
      skipDuplicates: true
    });
    expect(result).toEqual(
      expect.objectContaining({
        duplicate: false,
        payment: expect.objectContaining({ status: 'paid', providerPaymentNo: 'wx-pay-001' })
      })
    );
  });

  it('creates pickup fulfillment tasks with a pickup code after a paid callback', async () => {
    const { prisma, tx } = createPrismaMock();
    tx.orderHeader.findUnique.mockResolvedValue(pickupOrderRecord);
    const repository = new OrderPaymentRepository(prisma as never);

    await repository.processCallback({
      providerEventId: 'event-001',
      paymentNo: 'PAY-20260603-001',
      providerPaymentNo: 'wx-pay-001',
      status: 'paid',
      paidAt: new Date('2026-06-03T00:05:00.000Z'),
      payload: { event: 'paid' }
    });

    expect(tx.fulfillmentTask.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        fulfillmentType: 'pickup',
        receiverName: null,
        receiverPhone: null,
        receiverAddress: null,
        pickupStoreName: '浦东直营网点',
        pickupCode: expect.stringMatching(/^WM_PICKUP:FT-ORDER-20260603-001-MERCHANT-001-\d+$/)
      }),
      select: expect.any(Object)
    });
  });

  it('records a paid callback after cancellation without reviving payment or fulfillment', async () => {
    const { prisma, tx } = createPrismaMock();
    tx.orderState.findUnique.mockResolvedValue({
      id: 'order-state-001',
      orderNo: 'ORDER-20260603-001',
      status: 'cancelled',
      paidAt: null,
      refundRequestedAt: null,
      refundedAt: null,
      createdAt: new Date('2026-06-03T00:00:00.000Z'),
      updatedAt: new Date('2026-06-03T00:10:00.000Z')
    });
    const repository = new OrderPaymentRepository(prisma as never);

    const result = await repository.processCallback({
      providerEventId: 'event-after-cancel-001',
      paymentNo: 'PAY-20260603-001',
      providerPaymentNo: 'wx-pay-after-cancel-001',
      status: 'paid',
      paidAt: new Date('2026-06-03T00:11:00.000Z'),
      payload: { event: 'paid' }
    });

    expect(tx.orderPaymentCallback.create).toHaveBeenCalledWith({
      data: {
        paymentId: 'payment-001',
        paymentNo: 'PAY-20260603-001',
        providerEventId: 'event-after-cancel-001',
        providerPaymentNo: 'wx-pay-after-cancel-001',
        status: 'paid',
        payload: { event: 'paid' }
      },
      select: expect.any(Object)
    });
    expect(tx.orderState.update).not.toHaveBeenCalled();
    expect(tx.orderPayment.update).not.toHaveBeenCalled();
    expect(tx.orderHeader.update).not.toHaveBeenCalled();
    expect(tx.fulfillmentTask.create).not.toHaveBeenCalled();
    expect(tx.inventoryReservation.createMany).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        duplicate: false,
        payment: paymentRecord,
        callback: expect.objectContaining({
          providerEventId: 'event-001',
          status: 'paid'
        })
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
    expect(tx.orderHeader.update).not.toHaveBeenCalled();
    expect(tx.fulfillmentTask.create).not.toHaveBeenCalled();
    expect(tx.inventoryReservation.createMany).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        duplicate: true,
        payment: expect.objectContaining({ status: 'paid', providerPaymentNo: 'wx-pay-001' })
      })
    );
  });
});
