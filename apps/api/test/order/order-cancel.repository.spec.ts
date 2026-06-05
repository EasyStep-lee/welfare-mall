import { OrderCancelRepository } from '../../src/order/order-cancel.repository';

const pendingOrderRecord = {
  id: 'order-001',
  orderNo: 'ORDER-20260605-001',
  requestId: 'checkout-request-001',
  buyerUserId: 'user-001',
  status: 'pending_payment',
  subtotalAmount: 6990,
  discountAmount: 0,
  totalAmount: 6990,
  welfareCardPayableAmount: 0,
  cashPayableAmount: 6990,
  fulfillmentType: 'delivery',
  receiverName: 'Li Lei',
  receiverPhone: '13800000000',
  receiverAddress: 'Pudong Avenue 1',
  pickupStoreName: null,
  createdAt: new Date('2026-06-05T00:00:00.000Z'),
  updatedAt: new Date('2026-06-05T00:00:00.000Z')
};

const orderStateRecord = {
  id: 'order-state-001',
  orderNo: 'ORDER-20260605-001',
  status: 'pending_payment',
  paidAt: null,
  refundRequestedAt: null,
  refundedAt: null,
  createdAt: new Date('2026-06-05T00:00:00.000Z'),
  updatedAt: new Date('2026-06-05T00:00:00.000Z')
};

function createPrismaMock() {
  const tx = {
    orderHeader: {
      findFirst: jest.fn().mockResolvedValue(pendingOrderRecord),
      update: jest.fn().mockResolvedValue({ ...pendingOrderRecord, status: 'cancelled' })
    },
    orderState: {
      findUnique: jest.fn().mockResolvedValue(orderStateRecord),
      update: jest.fn().mockResolvedValue({ ...orderStateRecord, status: 'cancelled' })
    },
    inventoryReservation: {
      findMany: jest.fn().mockResolvedValue([
        {
          productId: 'product-001',
          skuId: 'sku-001',
          quantity: 1
        }
      ]),
      updateMany: jest.fn().mockResolvedValue({ count: 1 })
    },
    inventoryStock: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 })
    }
  };
  const prisma = {
    $transaction: jest.fn(async (callback) => callback(tx))
  };

  return { prisma, tx };
}

describe('OrderCancelRepository', () => {
  it('cancels a buyer pending-payment order and releases reserved inventory', async () => {
    const { prisma, tx } = createPrismaMock();
    const repository = new OrderCancelRepository(prisma as never);

    const result = await repository.cancelPendingPaymentOrder({
      orderNo: 'ORDER-20260605-001',
      buyerUserId: 'user-001',
      reason: 'user changed mind'
    });

    expect(tx.orderHeader.findFirst).toHaveBeenCalledWith({
      where: {
        orderNo: 'ORDER-20260605-001',
        buyerUserId: 'user-001',
        status: 'pending_payment'
      },
      select: expect.any(Object)
    });
    expect(tx.orderState.update).toHaveBeenCalledWith({
      where: { orderNo: 'ORDER-20260605-001' },
      data: { status: 'cancelled' },
      select: expect.any(Object)
    });
    expect(tx.orderHeader.update).toHaveBeenCalledWith({
      where: { orderNo: 'ORDER-20260605-001' },
      data: { status: 'cancelled' },
      select: expect.any(Object)
    });
    expect(tx.inventoryReservation.findMany).toHaveBeenCalledWith({
      where: {
        orderNo: 'ORDER-20260605-001',
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
        orderNo: 'ORDER-20260605-001',
        status: 'reserved'
      },
      data: {
        status: 'released',
        releasedAt: expect.any(Date)
      }
    });
    expect(tx.inventoryStock.updateMany).toHaveBeenCalledWith({
      where: { stockKey: 'product-001:sku-001' },
      data: {
        availableQuantity: { increment: 1 },
        reservedQuantity: { decrement: 1 }
      }
    });
    expect(result).toEqual(expect.objectContaining({ order: expect.objectContaining({ status: 'cancelled' }) }));
  });

  it('returns null without releasing inventory when the order is not pending payment for that buyer', async () => {
    const { prisma, tx } = createPrismaMock();
    tx.orderHeader.findFirst.mockResolvedValue(null);
    const repository = new OrderCancelRepository(prisma as never);

    const result = await repository.cancelPendingPaymentOrder({
      orderNo: 'ORDER-20260605-PAID',
      buyerUserId: 'user-001',
      reason: 'user changed mind'
    });

    expect(tx.orderState.update).not.toHaveBeenCalled();
    expect(tx.orderHeader.update).not.toHaveBeenCalled();
    expect(tx.inventoryReservation.findMany).not.toHaveBeenCalled();
    expect(tx.inventoryReservation.updateMany).not.toHaveBeenCalled();
    expect(tx.inventoryStock.updateMany).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
