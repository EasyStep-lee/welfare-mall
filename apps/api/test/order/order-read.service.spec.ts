import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderReadRepository } from '../../src/order/order-read.repository';
import { OrderReadService } from '../../src/order/order-read.service';

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
  lines: [],
  latestPayment: {
    paymentNo: 'PAY-20260603-001',
    status: 'pending',
    channel: 'wechat',
    totalAmount: 13980
  },
  latestRefund: {
    refundNo: 'REF-20260603-001',
    status: 'processing',
    channel: 'wechat',
    refundAmount: 13980,
    reason: 'after_sale'
  }
};

function createRepositoryMock() {
  return {
    listOrdersByBuyer: jest.fn().mockResolvedValue([orderRecord]),
    listRecentAdminOrders: jest.fn().mockResolvedValue([orderRecord]),
    findOrderForBuyer: jest.fn().mockResolvedValue(orderRecord)
  };
}

describe('OrderReadService', () => {
  it('lists orders for a buyer', async () => {
    const repository = createRepositoryMock();
    const service = new OrderReadService(repository as unknown as OrderReadRepository);

    const result = await service.listOrders({ buyerUserId: ' user-001 ' });

    expect(repository.listOrdersByBuyer).toHaveBeenCalledWith('user-001');
    expect(result).toEqual({ orders: [orderRecord] });
    expect(result.orders[0]?.latestPayment).toMatchObject({
      paymentNo: 'PAY-20260603-001',
      status: 'pending',
      channel: 'wechat'
    });
    expect(result.orders[0]?.latestRefund).toMatchObject({
      refundNo: 'REF-20260603-001',
      status: 'processing',
      channel: 'wechat',
      refundAmount: 13980,
      reason: 'after_sale'
    });
  });

  it('lists recent orders for Admin order management', async () => {
    const repository = createRepositoryMock();
    const service = new OrderReadService(repository as unknown as OrderReadRepository);

    const result = await service.listAdminOrders();

    expect(repository.listRecentAdminOrders).toHaveBeenCalledWith();
    expect(result).toEqual({ orders: [orderRecord] });
  });

  it('rejects blank buyer IDs', async () => {
    const repository = createRepositoryMock();
    const service = new OrderReadService(repository as unknown as OrderReadRepository);

    await expect(service.listOrders({ buyerUserId: ' ' })).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.listOrdersByBuyer).not.toHaveBeenCalled();
  });

  it('gets one buyer-scoped order detail', async () => {
    const repository = createRepositoryMock();
    const service = new OrderReadService(repository as unknown as OrderReadRepository);

    const result = await service.getOrderDetail({
      buyerUserId: ' user-001 ',
      orderNo: ' ORDER-20260603-001 '
    });

    expect(repository.findOrderForBuyer).toHaveBeenCalledWith({
      buyerUserId: 'user-001',
      orderNo: 'ORDER-20260603-001'
    });
    expect(result).toEqual({ order: orderRecord });
  });

  it('returns 404 when the buyer-scoped order does not exist', async () => {
    const repository = createRepositoryMock();
    repository.findOrderForBuyer.mockResolvedValue(null);
    const service = new OrderReadService(repository as unknown as OrderReadRepository);

    await expect(
      service.getOrderDetail({
        buyerUserId: 'user-001',
        orderNo: 'ORDER-MISSING'
      })
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
