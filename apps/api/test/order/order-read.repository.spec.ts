import { OrderReadRepository } from '../../src/order/order-read.repository';

const orderRecord = {
  id: 'order-001',
  orderNo: 'ORDER-20260603-001',
  requestId: 'checkout-request-001',
  buyerUserId: 'user-001',
  status: 'pending_payment',
  subtotalAmount: 13980,
  discountAmount: 0,
  totalAmount: 13980,
  welfareCardPayableAmount: 5000,
  cashPayableAmount: 8980,
  fulfillmentType: 'delivery',
  receiverName: 'Li Lei',
  receiverPhone: '13800000000',
  receiverAddress: 'Pudong Avenue 1',
  pickupStoreName: null,
  createdAt: new Date('2026-06-03T00:00:00.000Z'),
  updatedAt: new Date('2026-06-03T00:00:00.000Z'),
  lines: [
    {
      id: 'order-line-001',
      orderId: 'order-001',
      productPoolItemId: 'pool-item-001',
      productId: 'product-001',
      skuId: 'sku-001',
      displayName: 'Local Rice',
      displaySkuCode: 'SKU-RICE-5KG',
      displayImageUrl: 'https://cdn.example.com/rice.jpg',
      unitPriceAmount: 6990,
      quantity: 2,
      lineTotalAmount: 13980,
      createdAt: new Date('2026-06-03T00:00:00.000Z')
    }
  ]
};

const paymentRecord = {
  id: 'payment-001',
  paymentNo: 'PAY-20260603-001',
  requestId: 'payment-request-001',
  orderNo: 'ORDER-20260603-001',
  status: 'pending',
  channel: 'wechat',
  totalAmount: 13980,
  welfareCardPayableAmount: 5000,
  cashPayableAmount: 8980,
  providerPaymentNo: null,
  paidAt: null,
  createdAt: new Date('2026-06-03T00:05:00.000Z'),
  updatedAt: new Date('2026-06-03T00:05:00.000Z')
};

const refundRecord = {
  id: 'refund-001',
  refundNo: 'REF-20260603-001',
  requestId: 'refund-request-001',
  paymentNo: 'PAY-20260603-001',
  orderNo: 'ORDER-20260603-001',
  status: 'processing',
  channel: 'wechat',
  refundAmount: 13980,
  reason: 'after_sale',
  providerRefundNo: null,
  succeededAt: null,
  createdAt: new Date('2026-06-03T00:10:00.000Z'),
  updatedAt: new Date('2026-06-03T00:10:00.000Z')
};

const pendingFulfillmentTaskRecord = {
  id: 'fulfillment-task-001',
  taskNo: 'FT-ORDER-20260603-001-MERCHANT-001-001',
  orderNo: 'ORDER-20260603-001',
  merchantId: 'merchant-001',
  status: 'pending',
  createdAt: new Date('2026-06-03T00:15:00.000Z'),
  completedAt: null
};

const completedFulfillmentTaskRecord = {
  id: 'fulfillment-task-002',
  taskNo: 'FT-ORDER-20260603-001-MERCHANT-002-001',
  orderNo: 'ORDER-20260603-001',
  merchantId: 'merchant-002',
  status: 'completed',
  createdAt: new Date('2026-06-03T00:16:00.000Z'),
  completedAt: new Date('2026-06-03T00:30:00.000Z')
};

function createPrismaMock() {
  return {
    orderHeader: {
      findMany: jest.fn().mockResolvedValue([orderRecord]),
      findFirst: jest.fn().mockResolvedValue(orderRecord)
    },
    orderPayment: {
      findMany: jest.fn().mockResolvedValue([paymentRecord])
    },
    orderRefund: {
      findMany: jest.fn().mockResolvedValue([refundRecord])
    },
    fulfillmentTask: {
      findMany: jest.fn().mockResolvedValue([pendingFulfillmentTaskRecord, completedFulfillmentTaskRecord])
    }
  };
}

describe('OrderReadRepository', () => {
  it('lists buyer orders newest first with snapshot lines', async () => {
    const prisma = createPrismaMock();
    const repository = new OrderReadRepository(prisma as never);

    const result = await repository.listOrdersByBuyer('user-001');

    expect(prisma.orderHeader.findMany).toHaveBeenCalledWith({
      where: { buyerUserId: 'user-001' },
      orderBy: { createdAt: 'desc' },
      select: expect.any(Object)
    });
    expect(prisma.orderPayment.findMany).toHaveBeenCalledWith({
      where: { orderNo: { in: ['ORDER-20260603-001'] } },
      orderBy: { createdAt: 'desc' },
      select: expect.any(Object)
    });
    expect(prisma.orderRefund.findMany).toHaveBeenCalledWith({
      where: { orderNo: { in: ['ORDER-20260603-001'] } },
      orderBy: { createdAt: 'desc' },
      select: expect.any(Object)
    });
    expect(prisma.fulfillmentTask.findMany).not.toHaveBeenCalled();
    expect(result).toEqual([{ ...orderRecord, latestPayment: paymentRecord, latestRefund: refundRecord }]);
  });

  it('lists recent admin orders newest first with latest payment and fulfillment summary', async () => {
    const prisma = createPrismaMock();
    const repository = new OrderReadRepository(prisma as never);

    const result = await repository.listRecentAdminOrders();

    expect(prisma.orderHeader.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: expect.any(Object)
    });
    expect(prisma.orderPayment.findMany).toHaveBeenCalledWith({
      where: { orderNo: { in: ['ORDER-20260603-001'] } },
      orderBy: { createdAt: 'desc' },
      select: expect.any(Object)
    });
    expect(prisma.orderRefund.findMany).toHaveBeenCalledWith({
      where: { orderNo: { in: ['ORDER-20260603-001'] } },
      orderBy: { createdAt: 'desc' },
      select: expect.any(Object)
    });
    expect(prisma.fulfillmentTask.findMany).toHaveBeenCalledWith({
      where: { orderNo: { in: ['ORDER-20260603-001'] } },
      orderBy: { createdAt: 'asc' },
      select: expect.objectContaining({
        orderNo: true,
        taskNo: true,
        merchantId: true,
        status: true,
        createdAt: true,
        completedAt: true
      })
    });
    expect(result).toEqual([
      {
        ...orderRecord,
        latestPayment: paymentRecord,
        latestRefund: refundRecord,
        fulfillmentSummary: {
          totalTasks: 2,
          pendingTasks: 1,
          completedTasks: 1,
          taskNos: ['FT-ORDER-20260603-001-MERCHANT-001-001', 'FT-ORDER-20260603-001-MERCHANT-002-001']
        },
        fulfillmentTasks: [
          {
            taskNo: 'FT-ORDER-20260603-001-MERCHANT-001-001',
            merchantId: 'merchant-001',
            status: 'pending',
            createdAt: new Date('2026-06-03T00:15:00.000Z'),
            completedAt: null
          },
          {
            taskNo: 'FT-ORDER-20260603-001-MERCHANT-002-001',
            merchantId: 'merchant-002',
            status: 'completed',
            createdAt: new Date('2026-06-03T00:16:00.000Z'),
            completedAt: new Date('2026-06-03T00:30:00.000Z')
          }
        ]
      }
    ]);
  });

  it('filters recent admin orders by status', async () => {
    const prisma = createPrismaMock();
    const repository = new OrderReadRepository(prisma as never);

    await repository.listRecentAdminOrders({ status: 'refund_processing' });

    expect(prisma.orderHeader.findMany).toHaveBeenCalledWith({
      where: { status: 'refund_processing' },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: expect.any(Object)
    });
  });

  it('filters recent admin orders by pending fulfillment progress', async () => {
    const prisma = createPrismaMock();
    const repository = new OrderReadRepository(prisma as never);

    const result = await repository.listRecentAdminOrders({ fulfillmentStatus: 'pending' });

    expect(prisma.fulfillmentTask.findMany).toHaveBeenNthCalledWith(1, {
      orderBy: { createdAt: 'asc' },
      select: expect.any(Object)
    });
    expect(prisma.orderHeader.findMany).toHaveBeenCalledWith({
      where: { orderNo: { in: ['ORDER-20260603-001'] } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: expect.any(Object)
    });
    expect(prisma.fulfillmentTask.findMany).toHaveBeenNthCalledWith(2, {
      where: { orderNo: { in: ['ORDER-20260603-001'] } },
      orderBy: { createdAt: 'asc' },
      select: expect.objectContaining({
        orderNo: true,
        taskNo: true,
        merchantId: true,
        status: true,
        createdAt: true,
        completedAt: true
      })
    });
    expect(result).toEqual([
      expect.objectContaining({
        orderNo: 'ORDER-20260603-001',
        fulfillmentSummary: {
          totalTasks: 2,
          pendingTasks: 1,
          completedTasks: 1,
          taskNos: ['FT-ORDER-20260603-001-MERCHANT-001-001', 'FT-ORDER-20260603-001-MERCHANT-002-001']
        },
        fulfillmentTasks: expect.arrayContaining([
          expect.objectContaining({
            taskNo: 'FT-ORDER-20260603-001-MERCHANT-001-001',
            merchantId: 'merchant-001',
            status: 'pending'
          }),
          expect.objectContaining({
            taskNo: 'FT-ORDER-20260603-001-MERCHANT-002-001',
            merchantId: 'merchant-002',
            status: 'completed',
            completedAt: new Date('2026-06-03T00:30:00.000Z')
          })
        ])
      })
    ]);
  });

  it('filters recent admin orders by fulfillment merchant', async () => {
    const prisma = createPrismaMock();
    const repository = new OrderReadRepository(prisma as never);

    await repository.listRecentAdminOrders({ merchantId: 'merchant-001' });

    expect(prisma.fulfillmentTask.findMany).toHaveBeenNthCalledWith(1, {
      where: { merchantId: 'merchant-001' },
      orderBy: { createdAt: 'asc' },
      select: expect.objectContaining({
        orderNo: true,
        merchantId: true,
        status: true
      })
    });
    expect(prisma.orderHeader.findMany).toHaveBeenCalledWith({
      where: { orderNo: { in: ['ORDER-20260603-001'] } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: expect.any(Object)
    });
  });

  it('composes recent admin order filtering by status, fulfillment progress, and merchant', async () => {
    const prisma = createPrismaMock();
    const repository = new OrderReadRepository(prisma as never);

    await repository.listRecentAdminOrders({
      status: 'paid',
      fulfillmentStatus: 'pending',
      merchantId: 'merchant-001'
    });

    expect(prisma.fulfillmentTask.findMany).toHaveBeenNthCalledWith(1, {
      where: {
        merchantId: 'merchant-001',
        status: 'pending'
      },
      orderBy: { createdAt: 'asc' },
      select: expect.any(Object)
    });
    expect(prisma.orderHeader.findMany).toHaveBeenCalledWith({
      where: {
        status: 'paid',
        orderNo: { in: ['ORDER-20260603-001'] }
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: expect.any(Object)
    });
  });

  it('finds one order scoped to the buyer', async () => {
    const prisma = createPrismaMock();
    const repository = new OrderReadRepository(prisma as never);

    const result = await repository.findOrderForBuyer({
      buyerUserId: 'user-001',
      orderNo: 'ORDER-20260603-001'
    });

    expect(prisma.orderHeader.findFirst).toHaveBeenCalledWith({
      where: {
        buyerUserId: 'user-001',
        orderNo: 'ORDER-20260603-001'
      },
      select: expect.any(Object)
    });
    expect(prisma.orderPayment.findMany).toHaveBeenCalledWith({
      where: { orderNo: { in: ['ORDER-20260603-001'] } },
      orderBy: { createdAt: 'desc' },
      select: expect.any(Object)
    });
    expect(prisma.orderRefund.findMany).toHaveBeenCalledWith({
      where: { orderNo: { in: ['ORDER-20260603-001'] } },
      orderBy: { createdAt: 'desc' },
      select: expect.any(Object)
    });
    expect(prisma.fulfillmentTask.findMany).not.toHaveBeenCalled();
    expect(result).toEqual({ ...orderRecord, latestPayment: paymentRecord, latestRefund: refundRecord });
  });
});
