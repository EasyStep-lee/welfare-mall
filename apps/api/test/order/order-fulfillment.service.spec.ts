import { BadRequestException } from '@nestjs/common';
import { OrderFulfillmentRepository } from '../../src/order/order-fulfillment.repository';
import { OrderFulfillmentService } from '../../src/order/order-fulfillment.service';

const fulfillmentOrder = {
  orderNo: 'ORDER-20260603-001',
  status: 'paid',
  totalAmount: 13980,
  receiverName: 'Li Lei',
  lines: [{ displayName: 'Local Rice', quantity: 2 }]
};

function createRepositoryMock() {
  return {
    listPaidOrdersForMerchant: jest.fn().mockResolvedValue([fulfillmentOrder]),
    completePaidOrderForMerchant: jest.fn().mockResolvedValue({ ...fulfillmentOrder, status: 'completed', latestPayment: null })
  };
}

describe('OrderFulfillmentService', () => {
  it('lists merchant fulfillment orders', async () => {
    const repository = createRepositoryMock();
    const service = new OrderFulfillmentService(repository as unknown as OrderFulfillmentRepository);

    const result = await service.listMerchantFulfillmentOrders({ merchantId: ' merchant-001 ' });

    expect(repository.listPaidOrdersForMerchant).toHaveBeenCalledWith('merchant-001');
    expect(result).toEqual({ orders: [fulfillmentOrder] });
  });

  it('rejects blank merchant IDs', async () => {
    const repository = createRepositoryMock();
    const service = new OrderFulfillmentService(repository as unknown as OrderFulfillmentRepository);

    await expect(service.listMerchantFulfillmentOrders({ merchantId: ' ' })).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.listPaidOrdersForMerchant).not.toHaveBeenCalled();
  });

  it('completes a merchant fulfillment order', async () => {
    const repository = createRepositoryMock();
    const service = new OrderFulfillmentService(repository as unknown as OrderFulfillmentRepository);

    const result = await service.completeMerchantFulfillmentOrder({
      merchantId: ' merchant-001 ',
      orderNo: ' ORDER-20260603-001 '
    });

    expect(repository.completePaidOrderForMerchant).toHaveBeenCalledWith({
      merchantId: 'merchant-001',
      orderNo: 'ORDER-20260603-001'
    });
    expect(result).toEqual({ order: { ...fulfillmentOrder, status: 'completed', latestPayment: null } });
  });

  it('rejects blank order numbers when completing fulfillment', async () => {
    const repository = createRepositoryMock();
    const service = new OrderFulfillmentService(repository as unknown as OrderFulfillmentRepository);

    await expect(
      service.completeMerchantFulfillmentOrder({
        merchantId: 'merchant-001',
        orderNo: ' '
      })
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.completePaidOrderForMerchant).not.toHaveBeenCalled();
  });
});
