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

const fulfillmentTaskRecord = {
  id: 'fulfillment-task-001',
  taskNo: 'FT-ORDER-20260603-001-MERCHANT-001-001',
  orderNo: 'ORDER-20260603-001',
  merchantId: 'merchant-001',
  status: 'pending',
  fulfillmentType: 'delivery',
  receiverName: 'Li Lei',
  receiverPhone: '13800000000',
  receiverAddress: 'Pudong Avenue 1',
  pickupStoreName: null,
  createdAt: new Date('2026-06-03T00:10:00.000Z'),
  updatedAt: new Date('2026-06-03T00:10:00.000Z'),
  completedAt: null,
  order: {
    id: orderRecord.id,
    orderNo: orderRecord.orderNo,
    requestId: orderRecord.requestId,
    buyerUserId: orderRecord.buyerUserId,
    status: orderRecord.status,
    subtotalAmount: orderRecord.subtotalAmount,
    discountAmount: orderRecord.discountAmount,
    totalAmount: orderRecord.totalAmount,
    welfareCardPayableAmount: orderRecord.welfareCardPayableAmount,
    cashPayableAmount: orderRecord.cashPayableAmount,
    fulfillmentType: orderRecord.fulfillmentType,
    receiverName: orderRecord.receiverName,
    receiverPhone: orderRecord.receiverPhone,
    receiverAddress: orderRecord.receiverAddress,
    pickupStoreName: orderRecord.pickupStoreName,
    createdAt: orderRecord.createdAt,
    updatedAt: orderRecord.updatedAt
  },
  lines: [orderRecord.lines[0]]
};

function createPrismaMock() {
  const tx = {
    fulfillmentTask: {
      findFirst: jest.fn().mockResolvedValue(fulfillmentTaskRecord),
      update: jest.fn().mockResolvedValue({ ...fulfillmentTaskRecord, status: 'completed', completedAt: new Date('2026-06-03T00:20:00.000Z') }),
      count: jest.fn().mockResolvedValue(0)
    },
    orderHeader: {
      findUnique: jest.fn().mockResolvedValue(orderRecord),
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
    fulfillmentTask: {
      findMany: jest.fn().mockResolvedValue([fulfillmentTaskRecord])
    },
    orderPayment: {
      findMany: jest.fn().mockResolvedValue([paymentRecord])
    },
    $transaction: jest.fn(async (callback) => callback(tx)),
    tx
  };
}

describe('OrderFulfillmentRepository', () => {
  it('lists pending fulfillment task orders for one merchant', async () => {
    const prisma = createPrismaMock();
    const repository = new OrderFulfillmentRepository(prisma as never);

    const result = await repository.listPaidOrdersForMerchant('merchant-001');

    expect(prisma.fulfillmentTask.findMany).toHaveBeenCalledWith({
      where: {
        status: 'pending',
        merchantId: 'merchant-001'
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
        id: fulfillmentTaskRecord.id,
        taskNo: fulfillmentTaskRecord.taskNo,
        status: 'paid',
        fulfillmentType: fulfillmentTaskRecord.fulfillmentType,
        receiverName: fulfillmentTaskRecord.receiverName,
        receiverPhone: fulfillmentTaskRecord.receiverPhone,
        receiverAddress: fulfillmentTaskRecord.receiverAddress,
        pickupStoreName: fulfillmentTaskRecord.pickupStoreName,
        createdAt: fulfillmentTaskRecord.createdAt,
        updatedAt: fulfillmentTaskRecord.updatedAt,
        lines: [orderRecord.lines[0]],
        latestPayment: paymentRecord
      }
    ]);
  });

  it('filters fulfillment orders by status for merchant-owned products', async () => {
    const prisma = createPrismaMock();
    const repository = new OrderFulfillmentRepository(prisma as never);

    await repository.listOrdersForMerchant({ merchantId: 'merchant-001', status: 'completed' });

    expect(prisma.fulfillmentTask.findMany).toHaveBeenCalledWith({
      where: {
        status: 'completed',
        merchantId: 'merchant-001'
      },
      orderBy: { createdAt: 'desc' },
      select: expect.any(Object)
    });
  });

  it('filters fulfillment orders by status, order number, and task number', async () => {
    const prisma = createPrismaMock();
    const repository = new OrderFulfillmentRepository(prisma as never);

    await repository.listOrdersForMerchant({
      merchantId: 'merchant-001',
      status: 'completed',
      orderNo: 'ORDER-20260603-001',
      taskNo: 'FT-ORDER-20260603-001-MERCHANT-001-001'
    });

    expect(prisma.fulfillmentTask.findMany).toHaveBeenCalledWith({
      where: {
        status: 'completed',
        merchantId: 'merchant-001',
        orderNo: 'ORDER-20260603-001',
        taskNo: 'FT-ORDER-20260603-001-MERCHANT-001-001'
      },
      orderBy: { createdAt: 'desc' },
      select: expect.any(Object)
    });
  });

  it('returns an empty queue when the merchant has no products', async () => {
    const prisma = createPrismaMock();
    prisma.fulfillmentTask.findMany.mockResolvedValue([]);
    const repository = new OrderFulfillmentRepository(prisma as never);

    const result = await repository.listPaidOrdersForMerchant('merchant-empty');

    expect(result).toEqual([]);
    expect(prisma.orderPayment.findMany).not.toHaveBeenCalled();
  });

  it('completes a merchant fulfillment task and then completes the order when no tasks remain', async () => {
    const prisma = createPrismaMock();
    const repository = new OrderFulfillmentRepository(prisma as never);

    const result = await repository.completePaidOrderForMerchant({
      merchantId: 'merchant-001',
      orderNo: 'ORDER-20260603-001'
    });

    expect(prisma.tx.fulfillmentTask.findFirst).toHaveBeenCalledWith({
      where: {
        orderNo: 'ORDER-20260603-001',
        merchantId: 'merchant-001',
        status: 'pending'
      },
      select: expect.any(Object)
    });
    expect(prisma.tx.fulfillmentTask.update).toHaveBeenCalledWith({
      where: { id: 'fulfillment-task-001' },
      data: {
        status: 'completed',
        completedAt: expect.any(Date)
      },
      select: expect.any(Object)
    });
    expect(prisma.tx.fulfillmentTask.count).toHaveBeenCalledWith({
      where: {
        orderNo: 'ORDER-20260603-001',
        status: { not: 'completed' }
      }
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
    expect(result).toEqual({
      ...orderRecord,
      id: 'fulfillment-task-001',
      taskNo: fulfillmentTaskRecord.taskNo,
      status: 'completed',
      createdAt: fulfillmentTaskRecord.createdAt,
      updatedAt: fulfillmentTaskRecord.updatedAt,
      lines: [orderRecord.lines[0]],
      latestPayment: null
    });
  });

  it('returns null when the order does not contain merchant-owned products', async () => {
    const prisma = createPrismaMock();
    prisma.tx.fulfillmentTask.findFirst.mockResolvedValue(null);
    const repository = new OrderFulfillmentRepository(prisma as never);

    const result = await repository.completePaidOrderForMerchant({
      merchantId: 'merchant-001',
      orderNo: 'ORDER-OTHER'
    });

    expect(result).toBeNull();
    expect(prisma.tx.fulfillmentTask.update).not.toHaveBeenCalled();
    expect(prisma.tx.orderHeader.update).not.toHaveBeenCalled();
    expect(prisma.tx.orderState.update).not.toHaveBeenCalled();
  });

  it('does not complete the order while another merchant task remains pending', async () => {
    const prisma = createPrismaMock();
    prisma.tx.fulfillmentTask.count.mockResolvedValue(1);
    const repository = new OrderFulfillmentRepository(prisma as never);

    const result = await repository.completePaidOrderForMerchant({
      merchantId: 'merchant-001',
      orderNo: 'ORDER-20260603-001'
    });

    expect(result).toEqual(expect.objectContaining({ status: 'completed' }));
    expect(prisma.tx.orderHeader.update).not.toHaveBeenCalled();
    expect(prisma.tx.orderState.update).not.toHaveBeenCalled();
  });
});
