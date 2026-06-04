import { BadRequestException } from '@nestjs/common';
import { OrderFulfillmentRepository } from '../../src/order/order-fulfillment.repository';

const orderRecord = {
  id: 'order-001',
  orderNo: 'ORDER-20260603-001',
  requestId: 'checkout-request-001',
  buyerUserId: 'user-001',
  status: 'paid',
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
  updatedAt: new Date('2026-06-03T00:10:00.000Z'),
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
    },
    {
      id: 'order-line-002',
      orderId: 'order-001',
      productPoolItemId: 'pool-item-002',
      productId: 'product-other',
      skuId: 'sku-other',
      displayName: 'Other Merchant Tea',
      displaySkuCode: 'SKU-TEA',
      displayImageUrl: 'https://cdn.example.com/tea.jpg',
      unitPriceAmount: 2990,
      quantity: 1,
      lineTotalAmount: 2990,
      createdAt: new Date('2026-06-03T00:00:00.000Z')
    }
  ]
};

const paymentRecord = {
  id: 'payment-001',
  paymentNo: 'PAY-20260603-001',
  requestId: 'payment-request-001',
  orderNo: 'ORDER-20260603-001',
  status: 'paid',
  channel: 'wechat',
  totalAmount: 13980,
  welfareCardPayableAmount: 5000,
  cashPayableAmount: 8980,
  providerPaymentNo: 'wx-pay-001',
  paidAt: new Date('2026-06-03T00:10:00.000Z'),
  createdAt: new Date('2026-06-03T00:05:00.000Z'),
  updatedAt: new Date('2026-06-03T00:10:00.000Z')
};

function createPrismaMock() {
  const tx = {
    product: {
      findMany: jest.fn().mockResolvedValue([{ id: 'product-001' }])
    },
    orderHeader: {
      findFirst: jest.fn().mockResolvedValue(orderRecord),
      update: jest.fn().mockResolvedValue({ ...orderRecord, status: 'completed' })
    },
    orderState: {
      update: jest.fn().mockResolvedValue({
        id: 'order-state-001',
        orderNo: 'ORDER-20260603-001',
        status: 'completed',
        paidAt: new Date('2026-06-03T00:10:00.000Z'),
        refundRequestedAt: null,
        refundedAt: null,
        createdAt: new Date('2026-06-03T00:00:00.000Z'),
        updatedAt: new Date('2026-06-03T00:20:00.000Z')
      })
    }
  };
  return {
    product: {
      findMany: jest.fn().mockResolvedValue([{ id: 'product-001' }])
    },
    orderHeader: {
      findMany: jest.fn().mockResolvedValue([orderRecord])
    },
    orderPayment: {
      findMany: jest.fn().mockResolvedValue([paymentRecord])
    },
    $transaction: jest.fn(async (callback) => callback(tx)),
    tx
  };
}

describe('OrderFulfillmentRepository', () => {
  it('lists paid fulfillment orders for merchant-owned products', async () => {
    const prisma = createPrismaMock();
    const repository = new OrderFulfillmentRepository(prisma as never);

    const result = await repository.listPaidOrdersForMerchant('merchant-001');

    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: { merchantId: 'merchant-001' },
      select: { id: true }
    });
    expect(prisma.orderHeader.findMany).toHaveBeenCalledWith({
      where: {
        status: 'paid',
        lines: { some: { productId: { in: ['product-001'] } } }
      },
      orderBy: { createdAt: 'desc' },
      select: expect.any(Object)
    });
    expect(prisma.orderPayment.findMany).toHaveBeenCalledWith({
      where: { orderNo: { in: ['ORDER-20260603-001'] } },
      orderBy: { createdAt: 'desc' },
      select: expect.any(Object)
    });
    expect(result).toEqual([
      {
        ...orderRecord,
        lines: [orderRecord.lines[0]],
        latestPayment: paymentRecord
      }
    ]);
  });

  it('filters fulfillment orders by status for merchant-owned products', async () => {
    const prisma = createPrismaMock();
    const repository = new OrderFulfillmentRepository(prisma as never);

    await repository.listOrdersForMerchant({ merchantId: 'merchant-001', status: 'completed' });

    expect(prisma.orderHeader.findMany).toHaveBeenCalledWith({
      where: {
        status: 'completed',
        lines: { some: { productId: { in: ['product-001'] } } }
      },
      orderBy: { createdAt: 'desc' },
      select: expect.any(Object)
    });
  });

  it('returns an empty queue when the merchant has no products', async () => {
    const prisma = createPrismaMock();
    prisma.product.findMany.mockResolvedValue([]);
    const repository = new OrderFulfillmentRepository(prisma as never);

    const result = await repository.listPaidOrdersForMerchant('merchant-empty');

    expect(result).toEqual([]);
    expect(prisma.orderHeader.findMany).not.toHaveBeenCalled();
  });

  it('completes a paid merchant fulfillment order', async () => {
    const prisma = createPrismaMock();
    const repository = new OrderFulfillmentRepository(prisma as never);

    const result = await repository.completePaidOrderForMerchant({
      merchantId: 'merchant-001',
      orderNo: 'ORDER-20260603-001'
    });

    expect(prisma.tx.product.findMany).toHaveBeenCalledWith({
      where: { merchantId: 'merchant-001' },
      select: { id: true }
    });
    expect(prisma.tx.orderHeader.findFirst).toHaveBeenCalledWith({
      where: {
        orderNo: 'ORDER-20260603-001',
        lines: { some: { productId: { in: ['product-001'] } } }
      },
      select: expect.any(Object)
    });
    expect(prisma.tx.orderHeader.update).toHaveBeenCalledWith({
      where: { orderNo: 'ORDER-20260603-001' },
      data: { status: 'completed' },
      select: expect.any(Object)
    });
    expect(prisma.tx.orderState.update).toHaveBeenCalledWith({
      where: { orderNo: 'ORDER-20260603-001' },
      data: { status: 'completed' },
      select: expect.any(Object)
    });
    expect(result).toEqual({ ...orderRecord, status: 'completed', latestPayment: null });
  });

  it('returns null when the order does not contain merchant-owned products', async () => {
    const prisma = createPrismaMock();
    prisma.tx.orderHeader.findFirst.mockResolvedValue(null);
    const repository = new OrderFulfillmentRepository(prisma as never);

    const result = await repository.completePaidOrderForMerchant({
      merchantId: 'merchant-001',
      orderNo: 'ORDER-OTHER'
    });

    expect(result).toBeNull();
    expect(prisma.tx.orderHeader.update).not.toHaveBeenCalled();
    expect(prisma.tx.orderState.update).not.toHaveBeenCalled();
  });

  it('rejects completion when the merchant order is not paid', async () => {
    const prisma = createPrismaMock();
    prisma.tx.orderHeader.findFirst.mockResolvedValue({ ...orderRecord, status: 'refund_processing' });
    const repository = new OrderFulfillmentRepository(prisma as never);

    await expect(
      repository.completePaidOrderForMerchant({
        merchantId: 'merchant-001',
        orderNo: 'ORDER-20260603-001'
      })
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.tx.orderHeader.update).not.toHaveBeenCalled();
    expect(prisma.tx.orderState.update).not.toHaveBeenCalled();
  });
});
