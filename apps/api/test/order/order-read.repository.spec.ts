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
    expect(result).toEqual([{ ...orderRecord, latestPayment: paymentRecord, latestRefund: refundRecord }]);
  });

  it('lists recent admin orders newest first with latest payment', async () => {
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
    expect(result).toEqual([{ ...orderRecord, latestPayment: paymentRecord, latestRefund: refundRecord }]);
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
    expect(result).toEqual({ ...orderRecord, latestPayment: paymentRecord, latestRefund: refundRecord });
  });
});
