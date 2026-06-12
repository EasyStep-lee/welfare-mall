import { ConflictException, NotFoundException } from '@nestjs/common';
import { OrderRefundRepository } from '../../src/order/order-refund.repository';
import { OrderRefundService } from '../../src/order/order-refund.service';
import { SettlementRepository } from '../../src/settlement/settlement.repository';

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

function createSettlementRepositoryMock() {
  return {
    applyRefundOffsetForSucceededRefund: jest.fn().mockResolvedValue({ items: [] }),
    generateFranchiseSalesLedgerForSucceededRefund: jest.fn().mockResolvedValue({ entries: [] })
  };
}

function createServiceFixture() {
  const repository = createRepositoryMock();
  const settlementRepository = createSettlementRepositoryMock();
  const service = new OrderRefundService(
    repository as unknown as OrderRefundRepository,
    settlementRepository as unknown as SettlementRepository
  );

  return {
    repository,
    settlementRepository,
    service
  };
}

describe('OrderRefundService', () => {
  it('creates a processing refund order', async () => {
    const { repository, service } = createServiceFixture();

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

  it('rejects offline cash refund channel before creating refund', async () => {
    const { repository, service } = createServiceFixture();

    await expect(
      service.createRefund({
        requestId: 'refund-request-001',
        paymentNo: 'PAY-20260603-001',
        orderNo: 'ORDER-20260603-001',
        channel: 'cash' as never,
        refundAmount: 5000,
        reason: 'user_cancel'
      })
    ).rejects.toMatchObject({
      response: {
        message: expect.arrayContaining(['channel must be one of wechat, alipay.'])
      }
    });

    expect(repository.createRefund).not.toHaveBeenCalled();
  });

  it('returns existing refund for the same idempotent request', async () => {
    const { repository, service } = createServiceFixture();
    repository.findRefundByRequestId.mockResolvedValue(refundRecord);

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
    const { repository, service } = createServiceFixture();
    repository.findRefundByRequestId.mockResolvedValue(refundRecord);

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
    const { repository, settlementRepository, service } = createServiceFixture();

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
    expect(settlementRepository.applyRefundOffsetForSucceededRefund).toHaveBeenCalledWith({
      orderNo: 'ORDER-20260603-001',
      refundAmount: 5000
    });
    expect(settlementRepository.generateFranchiseSalesLedgerForSucceededRefund).toHaveBeenCalledWith({
      orderNo: 'ORDER-20260603-001',
      paymentNo: 'PAY-20260603-001',
      refundNo: 'REF-20260603-001',
      refundAmount: 5000
    });
  });

  it('does not apply settlement refund offset for duplicate callbacks', async () => {
    const { repository, settlementRepository, service } = createServiceFixture();
    repository.processCallback.mockResolvedValue({
      duplicate: true,
      refund: { ...refundRecord, status: 'succeeded', providerRefundNo: 'wx-refund-001' },
      callback: {
        id: 'refund-callback-001',
        refundNo: refundRecord.refundNo,
        providerEventId: 'refund-event-001',
        status: 'succeeded'
      }
    });

    await service.processCallback({
      providerEventId: 'refund-event-001',
      refundNo: 'REF-20260603-001',
      providerRefundNo: 'wx-refund-001',
      status: 'succeeded',
      succeededAt: new Date('2026-06-03T00:15:00.000Z'),
      payload: { event: 'refund.succeeded' }
    });

    expect(settlementRepository.applyRefundOffsetForSucceededRefund).not.toHaveBeenCalled();
    expect(settlementRepository.generateFranchiseSalesLedgerForSucceededRefund).not.toHaveBeenCalled();
  });

  it('does not apply settlement refund offset for failed callbacks', async () => {
    const { repository, settlementRepository, service } = createServiceFixture();
    repository.processCallback.mockResolvedValue({
      duplicate: false,
      refund: { ...refundRecord, status: 'failed', providerRefundNo: 'wx-refund-001' },
      callback: {
        id: 'refund-callback-001',
        refundNo: refundRecord.refundNo,
        providerEventId: 'refund-event-001',
        status: 'failed'
      }
    });

    await service.processCallback({
      providerEventId: 'refund-event-001',
      refundNo: 'REF-20260603-001',
      providerRefundNo: 'wx-refund-001',
      status: 'failed',
      succeededAt: null,
      payload: { event: 'refund.failed' }
    });

    expect(settlementRepository.applyRefundOffsetForSucceededRefund).not.toHaveBeenCalled();
    expect(settlementRepository.generateFranchiseSalesLedgerForSucceededRefund).not.toHaveBeenCalled();
  });

  it('returns not found when callback references a missing refund', async () => {
    const { repository, service } = createServiceFixture();
    repository.processCallback.mockResolvedValue(null);

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
