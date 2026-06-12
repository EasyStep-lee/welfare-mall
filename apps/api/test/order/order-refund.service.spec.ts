import { ConflictException, NotFoundException } from '@nestjs/common';
import { RefundChannelProvider } from '../../src/order/order-refund-provider';
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
    createRefund: jest.fn().mockImplementation(async (input) => ({
      ...refundRecord,
      refundNo: input.refundNo,
      requestId: input.requestId,
      paymentNo: input.paymentNo,
      orderNo: input.orderNo,
      channel: input.channel,
      refundAmount: input.refundAmount,
      reason: input.reason
    })),
    findRefundProviderContext: jest.fn().mockResolvedValue({
      paymentNo: 'PAY-20260603-001',
      orderNo: 'ORDER-20260603-001',
      channel: 'wechat',
      totalAmount: 5000,
      cashPayableAmount: 4000,
      providerPaymentNo: 'wx-pay-001',
      components: [
        {
          sequenceNo: 1,
          componentType: 'welfare_card',
          channel: 'welfare_card',
          amount: 1000
        },
        {
          sequenceNo: 2,
          componentType: 'online_cash',
          channel: 'wechat',
          amount: 4000
        }
      ]
    }),
    markRefundProviderInitiated: jest.fn().mockResolvedValue({
      ...refundRecord,
      providerRefundNo: 'wx-refund-001'
    }),
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

function createRefundProviderMock() {
  return {
    createRefund: jest.fn().mockResolvedValue({
      skipped: false,
      providerRefundNo: 'wx-refund-001',
      payload: { refund_id: 'wx-refund-001' }
    })
  };
}

function createNoopRefundProviderMock() {
  return {
    createRefund: jest.fn().mockResolvedValue({
      skipped: true,
      providerRefundNo: null,
      payload: null
    })
  };
}

function createSettlementRepositoryMock() {
  return {
    applyRefundOffsetForSucceededRefund: jest.fn().mockResolvedValue({ items: [] }),
    generateFranchiseSalesLedgerForSucceededRefund: jest.fn().mockResolvedValue({ entries: [] })
  };
}

function createServiceFixture(refundProvider = createNoopRefundProviderMock()) {
  const repository = createRepositoryMock();
  const settlementRepository = createSettlementRepositoryMock();
  const service = new OrderRefundService(
    repository as unknown as OrderRefundRepository,
    settlementRepository as unknown as SettlementRepository,
    refundProvider as unknown as RefundChannelProvider
  );

  return {
    repository,
    refundProvider,
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
    expect(result).toEqual({
      idempotentReplay: false,
      refund: expect.objectContaining({
        requestId: 'refund-request-001',
        paymentNo: 'PAY-20260603-001',
        orderNo: 'ORDER-20260603-001',
        channel: 'wechat',
        refundAmount: 5000,
        reason: 'user_cancel',
        status: 'processing'
      })
    });
  });

  it('initiates provider refund only for the online cash component amount', async () => {
    const { refundProvider, repository, service } = createServiceFixture(createRefundProviderMock());

    const result = await service.createRefund({
      requestId: 'refund-request-001',
      paymentNo: 'PAY-20260603-001',
      orderNo: 'ORDER-20260603-001',
      channel: 'wechat',
      refundAmount: 5000,
      reason: 'after_sale'
    });

    expect(repository.findRefundProviderContext).toHaveBeenCalledWith('PAY-20260603-001');
    expect(refundProvider.createRefund).toHaveBeenCalledWith({
      refundNo: expect.any(String),
      paymentNo: 'PAY-20260603-001',
      providerPaymentNo: 'wx-pay-001',
      channel: 'wechat',
      onlineRefundAmount: 4000,
      originalOnlineAmount: 4000,
      reason: 'after_sale',
      requestedAt: expect.any(Date)
    });
    expect(repository.markRefundProviderInitiated).toHaveBeenCalledWith({
      refundNo: expect.any(String),
      providerRefundNo: 'wx-refund-001'
    });
    expect(result.refund.providerRefundNo).toBe('wx-refund-001');
  });

  it('does not initiate provider refund when the refund only returns welfare-card amount', async () => {
    const { refundProvider, repository, service } = createServiceFixture();

    await service.createRefund({
      requestId: 'refund-request-001',
      paymentNo: 'PAY-20260603-001',
      orderNo: 'ORDER-20260603-001',
      channel: 'wechat',
      refundAmount: 500,
      reason: 'after_sale'
    });

    expect(repository.findRefundProviderContext).toHaveBeenCalledWith('PAY-20260603-001');
    expect(refundProvider.createRefund).not.toHaveBeenCalled();
    expect(repository.markRefundProviderInitiated).not.toHaveBeenCalled();
  });

  it('rejects refund before creating a local refund record when original payment context is missing', async () => {
    const { repository, service } = createServiceFixture();
    repository.findRefundProviderContext.mockResolvedValue(null);

    await expect(
      service.createRefund({
        requestId: 'refund-request-001',
        paymentNo: 'PAY-MISSING',
        orderNo: 'ORDER-20260603-001',
        channel: 'wechat',
        refundAmount: 5000,
        reason: 'after_sale'
      })
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(repository.createRefund).not.toHaveBeenCalled();
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
