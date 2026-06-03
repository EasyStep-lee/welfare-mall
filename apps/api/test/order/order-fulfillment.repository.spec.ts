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
  return {
    product: {
      findMany: jest.fn().mockResolvedValue([{ id: 'product-001' }])
    },
    orderHeader: {
      findMany: jest.fn().mockResolvedValue([orderRecord])
    },
    orderPayment: {
      findMany: jest.fn().mockResolvedValue([paymentRecord])
    }
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

  it('returns an empty queue when the merchant has no products', async () => {
    const prisma = createPrismaMock();
    prisma.product.findMany.mockResolvedValue([]);
    const repository = new OrderFulfillmentRepository(prisma as never);

    const result = await repository.listPaidOrdersForMerchant('merchant-empty');

    expect(result).toEqual([]);
    expect(prisma.orderHeader.findMany).not.toHaveBeenCalled();
  });
});
