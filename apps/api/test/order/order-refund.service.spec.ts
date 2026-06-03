import { ConflictException, NotFoundException } from '@nestjs/common';
import { OrderRefundRepository } from '../../src/order/order-refund.repository';
import { OrderRefundService } from '../../src/order/order-refund.service';

const refundRecord = {
  id: 'refund-001',
  refundNo: 'REF-20260603-001',
  requestId: 'refund-request-001',
  paymentNo: 'PAY-20260603-001',
  orderNo: 'ORDER-20260603-001',
  status: 'processing',
  channel: 'wechat',
  refundAmount: 5000,
  reason: 'user_cancel',
  providerRefundNo: null,
  succeededAt: null,
  createdAt: new Date('2026-06-03T00:10:00.000Z'),
  updatedAt: new Date('2026-06-03T00:10:00.000Z')
};

function createRepositoryMock() {
  return {
    findRefundByRequestId: jest.fn().mockResolvedValue(null),
    createRefund: jest.fn().mockResolvedValue(refundRecord),
    processCallback: jest.fn().mockResolvedValue({
      duplicate: false,
      refund: { ...refundRecord, status: 'succeeded', providerRefundNo: 'wx-refund-001' },
      callback: {
        id: 'refund-callback-001',
        refundNo: refundRecord.refundNo,
        providerEventId: 'refund-event-001',
        status: 'succeeded'
      }
    })
  };
}

describe('OrderRefundService', () => {
  it('creates a processing refund order', async () => {
    const repository = createRepositoryMock();
    const service = new OrderRefundService(repository as unknown as OrderRefundRepository);

    const result = await service.createRefund({
      requestId: 'refund-request-001',
      paymentNo: 'PAY-20260603-001',
      orderNo: 'ORDER-20260603-001',
      channel: 'wechat',
      refundAmount: 5000,
      reason: 'user_cancel'
    });

    expect(repository.createRefund).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'refund-request-001',
        paymentNo: 'PAY-20260603-001',
        orderNo: 'ORDER-20260603-001',
        channel: 'wechat',
        refundAmount: 5000,
        reason: 'user_cancel'
      })
    );
    expect(result).toEqual({ idempotentReplay: false, refund: refundRecord });
  });

  it('returns existing refund for the same idempotent request', async () => {
    const repository = createRepositoryMock();
    repository.findRefundByRequestId.mockResolvedValue(refundRecord);
    const service = new OrderRefundService(repository as unknown as OrderRefundRepository);

    const result = await service.createRefund({
      requestId: 'refund-request-001',
      paymentNo: 'PAY-20260603-001',
      orderNo: 'ORDER-20260603-001',
      channel: 'wechat',
      refundAmount: 5000,
      reason: 'user_cancel'
    });

    expect(repository.createRefund).not.toHaveBeenCalled();
    expect(result).toEqual({ idempotentReplay: true, refund: refundRecord });
  });

  it('rejects a reused request ID with different refund amount', async () => {
    const repository = createRepositoryMock();
    repository.findRefundByRequestId.mockResolvedValue(refundRecord);
    const service = new OrderRefundService(repository as unknown as OrderRefundRepository);

    await expect(
      service.createRefund({
        requestId: 'refund-request-001',
        paymentNo: 'PAY-20260603-001',
        orderNo: 'ORDER-20260603-001',
        channel: 'wechat',
        refundAmount: 3000,
        reason: 'user_cancel'
      })
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('processes refund callback through repository idempotency', async () => {
    const repository = createRepositoryMock();
    const service = new OrderRefundService(repository as unknown as OrderRefundRepository);

    const result = await service.processCallback({
      providerEventId: 'refund-event-001',
      refundNo: 'REF-20260603-001',
      providerRefundNo: 'wx-refund-001',
      status: 'succeeded',
      succeededAt: new Date('2026-06-03T00:15:00.000Z'),
      payload: { event: 'refund.succeeded' }
    });

    expect(repository.processCallback).toHaveBeenCalledWith({
      providerEventId: 'refund-event-001',
      refundNo: 'REF-20260603-001',
      providerRefundNo: 'wx-refund-001',
      status: 'succeeded',
      succeededAt: new Date('2026-06-03T00:15:00.000Z'),
      payload: { event: 'refund.succeeded' }
    });
    expect(result).toEqual(expect.objectContaining({ duplicate: false }));
  });

  it('returns not found when callback references a missing refund', async () => {
    const repository = createRepositoryMock();
    repository.processCallback.mockResolvedValue(null);
    const service = new OrderRefundService(repository as unknown as OrderRefundRepository);

    await expect(
      service.processCallback({
        providerEventId: 'refund-event-001',
        refundNo: 'REF-MISSING',
        providerRefundNo: 'wx-refund-001',
        status: 'succeeded',
        succeededAt: new Date('2026-06-03T00:15:00.000Z'),
        payload: { event: 'refund.succeeded' }
      })
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
