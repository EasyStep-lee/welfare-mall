import { InsufficientInventoryError, OrderCheckoutRepository } from '../../src/order/order-checkout.repository';

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
  receiverName: '李雷',
  receiverPhone: '13800000000',
  receiverAddress: '上海市浦东新区世纪大道 1 号',
  pickupStoreName: null,
  salesFranchiseId: 'franchise-001',
  salesFranchiseName: '浦东福利加盟商',
  fulfillmentMerchantId: 'merchant-001',
  fulfillmentMerchantName: '浦东福利履约商户',
  fulfillmentMerchantAddress: '上海市浦东新区世纪大道 88 号',
  createdAt: new Date('2026-06-03T00:00:00.000Z'),
  updatedAt: new Date('2026-06-03T00:00:00.000Z'),
  lines: [
    {
      id: 'order-line-001',
      orderId: 'order-001',
      productPoolItemId: 'pool-item-001',
      productId: 'product-001',
      skuId: 'sku-001',
      displayName: '东北五常大米福利装',
      displaySkuCode: 'SKU-RICE-5KG',
      displayImageUrl: 'https://cdn.example.com/products/rice-main.jpg',
      unitPriceAmount: 6990,
      quantity: 2,
      lineTotalAmount: 13980,
      createdAt: new Date('2026-06-03T00:00:00.000Z')
    }
  ]
};

function createPrismaMock() {
  const tx = {
    orderHeader: {
      create: jest.fn().mockResolvedValue(orderRecord)
    },
    product: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'product-001',
          franchiseId: 'franchise-001',
          franchise: {
            id: 'franchise-001',
            name: '浦东福利加盟商'
          },
          merchantId: 'merchant-001',
          merchant: {
            id: 'merchant-001',
            name: '浦东福利履约商户',
            address: '上海市浦东新区世纪大道 88 号'
          }
        }
      ])
    },
    inventoryStock: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 })
    },
    inventoryReservation: {
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
  const prisma = {
    orderHeader: {
      findUnique: jest.fn().mockResolvedValue(null)
    },
    $transaction: jest.fn(async (callback) => callback(tx))
  };

  return { prisma, tx };
}

describe('OrderCheckoutRepository', () => {
  it('finds an existing order by idempotency request ID', async () => {
    const { prisma } = createPrismaMock();
    prisma.orderHeader.findUnique.mockResolvedValue(orderRecord);
    const repository = new OrderCheckoutRepository(prisma as never);

    const result = await repository.findOrderByRequestId('checkout-request-001');

    expect(prisma.orderHeader.findUnique).toHaveBeenCalledWith({
      where: { requestId: 'checkout-request-001' },
      select: expect.any(Object)
    });
    expect(result).toEqual(orderRecord);
  });

  it('creates an order header with snapshot lines and pending payment state', async () => {
    const { prisma, tx } = createPrismaMock();
    const repository = new OrderCheckoutRepository(prisma as never);

    const result = await repository.createOrder({
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
      receiverName: '李雷',
      receiverPhone: '13800000000',
      receiverAddress: '上海市浦东新区世纪大道 1 号',
      pickupStoreName: null,
      lines: [
        {
          productPoolItemId: 'pool-item-001',
          productId: 'product-001',
          skuId: 'sku-001',
          displayName: '东北五常大米福利装',
          displaySkuCode: 'SKU-RICE-5KG',
          displayImageUrl: 'https://cdn.example.com/products/rice-main.jpg',
          unitPriceAmount: 6990,
          quantity: 2,
          lineTotalAmount: 13980
        }
      ]
    });

    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function));
    expect(tx.orderHeader.create).toHaveBeenCalledWith({
      data: {
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
        receiverName: '李雷',
        receiverPhone: '13800000000',
        receiverAddress: '上海市浦东新区世纪大道 1 号',
        pickupStoreName: null,
        salesFranchiseId: 'franchise-001',
        salesFranchiseName: '浦东福利加盟商',
        fulfillmentMerchantId: 'merchant-001',
        fulfillmentMerchantName: '浦东福利履约商户',
        fulfillmentMerchantAddress: '上海市浦东新区世纪大道 88 号',
        lines: {
          create: [
            {
              productPoolItemId: 'pool-item-001',
              productId: 'product-001',
              skuId: 'sku-001',
              displayName: '东北五常大米福利装',
              displaySkuCode: 'SKU-RICE-5KG',
              displayImageUrl: 'https://cdn.example.com/products/rice-main.jpg',
              unitPriceAmount: 6990,
              quantity: 2,
              lineTotalAmount: 13980
            }
          ]
        }
      },
      select: expect.any(Object)
    });
    expect(tx.orderState.upsert).toHaveBeenCalledWith({
      where: { orderNo: 'ORDER-20260603-001' },
      create: {
        orderNo: 'ORDER-20260603-001',
        status: 'pending_payment'
      },
      update: {},
      select: expect.any(Object)
    });
    expect(tx.product.findMany).toHaveBeenCalledWith({
      where: { id: { in: ['product-001'] } },
      select: {
        id: true,
        franchiseId: true,
        franchise: {
          select: {
            id: true,
            name: true
          }
        },
        merchantId: true,
        merchant: {
          select: {
            id: true,
            name: true,
            address: true
          }
        }
      }
    });
    expect(tx.inventoryStock.updateMany).toHaveBeenCalledWith({
      where: {
        stockKey: 'product-001:sku-001',
        availableQuantity: { gte: 2 }
      },
      data: {
        availableQuantity: { decrement: 2 },
        reservedQuantity: { increment: 2 }
      }
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
          source: 'order_checkout'
        }
      ],
      skipDuplicates: true
    });
    expect(result).toEqual(orderRecord);
  });

  it('rejects checkout creation when stock cannot be reserved', async () => {
    const { tx, prisma } = createPrismaMock();
    tx.inventoryStock.updateMany.mockResolvedValue({ count: 0 });
    const repository = new OrderCheckoutRepository(prisma as never);

    await expect(
      repository.createOrder({
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
        receiverName: '李雷',
        receiverPhone: '13800000000',
        receiverAddress: '上海市浦东新区世纪大道 1 号',
        pickupStoreName: null,
        lines: [
          {
            productPoolItemId: 'pool-item-001',
            productId: 'product-001',
            skuId: 'sku-001',
            displayName: '东北五常大米福利装',
            displaySkuCode: 'SKU-RICE-5KG',
            displayImageUrl: 'https://cdn.example.com/products/rice-main.jpg',
            unitPriceAmount: 6990,
            quantity: 2,
            lineTotalAmount: 13980
          }
        ]
      })
    ).rejects.toBeInstanceOf(InsufficientInventoryError);

    expect(tx.inventoryReservation.createMany).not.toHaveBeenCalled();
  });
});
