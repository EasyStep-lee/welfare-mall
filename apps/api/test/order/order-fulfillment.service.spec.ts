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
    listPaidOrdersForMerchant: jest.fn().mockResolvedValue([fulfillmentOrder])
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
});
