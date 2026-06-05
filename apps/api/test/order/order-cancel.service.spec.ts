import { BadRequestException, ConflictException } from '@nestjs/common';
import { OrderCancelRepository } from '../../src/order/order-cancel.repository';
import { OrderCancelService } from '../../src/order/order-cancel.service';

function createRepositoryMock() {
  return {
    cancelPendingPaymentOrder: jest.fn().mockResolvedValue({
      order: {
        orderNo: 'ORDER-20260605-001',
        buyerUserId: 'user-001',
        status: 'cancelled'
      }
    })
  };
}

describe('OrderCancelService', () => {
  it('normalizes input and delegates buyer cancellation to the repository', async () => {
    const repository = createRepositoryMock();
    const service = new OrderCancelService(repository as unknown as OrderCancelRepository);

    const result = await service.cancelOrder({
      orderNo: ' ORDER-20260605-001 ',
      buyerUserId: ' user-001 ',
      reason: ' user changed mind '
    });

    expect(repository.cancelPendingPaymentOrder).toHaveBeenCalledWith({
      orderNo: 'ORDER-20260605-001',
      buyerUserId: 'user-001',
      reason: 'user changed mind'
    });
    expect(result.order.status).toBe('cancelled');
  });

  it.each([
    [{ orderNo: ' ', buyerUserId: 'user-001', reason: 'user changed mind' }, 'orderNo'],
    [{ orderNo: 'ORDER-20260605-001', buyerUserId: ' ', reason: 'user changed mind' }, 'buyerUserId'],
    [{ orderNo: 'ORDER-20260605-001', buyerUserId: 'user-001', reason: ' ' }, 'reason']
  ])('rejects blank %s before calling the repository', async (input, fieldName) => {
    const repository = createRepositoryMock();
    const service = new OrderCancelService(repository as unknown as OrderCancelRepository);

    await expect(service.cancelOrder(input)).rejects.toThrow(BadRequestException);
    await expect(service.cancelOrder(input)).rejects.toThrow(`${fieldName} is required`);
    expect(repository.cancelPendingPaymentOrder).not.toHaveBeenCalled();
  });

  it('maps non-cancellable orders to conflict', async () => {
    const repository = createRepositoryMock();
    repository.cancelPendingPaymentOrder.mockResolvedValue(null);
    const service = new OrderCancelService(repository as unknown as OrderCancelRepository);

    await expect(
      service.cancelOrder({
        orderNo: 'ORDER-20260605-PAID',
        buyerUserId: 'user-001',
        reason: 'user changed mind'
      })
    ).rejects.toThrow(ConflictException);
  });
});
