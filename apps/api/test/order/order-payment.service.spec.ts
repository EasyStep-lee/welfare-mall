import { ConflictException, NotFoundException } from '@nestjs/common';
import { OrderPaymentRepository } from '../../src/order/order-payment.repository';
import { OrderPaymentService } from '../../src/order/order-payment.service';
import { SettlementRepository } from '../../src/settlement/settlement.repository';

const paymentRecord = {
  id: 'payment-001',
  paymentNo: 'PAY-20260603-001',
  requestId: 'request-001',
  orderNo: 'ORDER-20260603-001',
  status: 'pending',
  channel: 'wechat',
  totalAmount: 13980,
  welfareCardPayableAmount: 5000,
  cashPayableAmount: 8980,
  providerPaymentNo: null,
  paidAt: null,
  createdAt: new Date('2026-06-03T00:00:00.000Z'),
  updatedAt: new Date('2026-06-03T00:00:00.000Z')
};

function createRepositoryMock() {
  return {
    findPaymentByRequestId: jest.fn().mockResolvedValue(null),
    findOrderStateByOrderNo: jest.fn().mockResolvedValue({
      id: 'order-state-001',
      orderNo: 'ORDER-20260603-001',
      status: 'pending_payment',
      paidAt: null,
      refundRequestedAt: null,
      refundedAt: null,
      createdAt: new Date('2026-06-03T00:00:00.000Z'),
      updatedAt: new Date('2026-06-03T00:00:00.000Z')
    }),
    createPayment: jest.fn().mockResolvedValue(paymentRecord),
    processCallback: jest.fn().mockResolvedValue({
      duplicate: false,
      payment: { ...paymentRecord, status: 'paid', providerPaymentNo: 'wx-pay-001' },
      callback: {
        id: 'callback-001',
        paymentNo: paymentRecord.paymentNo,
        providerEventId: 'event-001',
        status: 'paid'
      }
    })
  };
}

function createSettlementRepositoryMock() {
  return {
    generateMerchantBillItemsForPaidOrder: jest.fn().mockResolvedValue({ items: [] })
  };
}

function createServiceFixture() {
  const repository = createRepositoryMock();
  const settlementRepository = createSettlementRepositoryMock();
  const service = new OrderPaymentService(
    repository as unknown as OrderPaymentRepository,
    settlementRepository as unknown as SettlementRepository
  );

  return {
    repository,
    settlementRepository,
    service
  };
}

describe('OrderPaymentService', () => {
  it('creates a pending payment order', async () => {
    const { repository, service } = createServiceFixture();

    const result = await service.createPayment({
      requestId: 'request-001',
      orderNo: 'ORDER-20260603-001',
      channel: 'wechat',
      totalAmount: 13980,
      welfareCardPayableAmount: 5000,
      cashPayableAmount: 8980
    });

    expect(repository.createPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'request-001',
        orderNo: 'ORDER-20260603-001',
        channel: 'wechat',
        totalAmount: 13980,
        welfareCardPayableAmount: 5000,
        cashPayableAmount: 8980
      })
    );
    expect(result).toEqual({ idempotentReplay: false, payment: paymentRecord });
  });

  it.each(['cancelled', 'closed', null])(
    'rejects payment creation when order state is %s',
    async (status) => {
      const repository = createRepositoryMock();
      const settlementRepository = createSettlementRepositoryMock();
      repository.findOrderStateByOrderNo.mockResolvedValue(
        status === null
          ? null
          : {
              id: 'order-state-001',
              orderNo: 'ORDER-20260603-001',
              status,
              paidAt: null,
              refundRequestedAt: null,
              refundedAt: null,
              createdAt: new Date('2026-06-03T00:00:00.000Z'),
              updatedAt: new Date('2026-06-03T00:00:00.000Z')
            }
      );
      const service = new OrderPaymentService(
        repository as unknown as OrderPaymentRepository,
        settlementRepository as unknown as SettlementRepository
      );

      await expect(
        service.createPayment({
          requestId: 'request-001',
          orderNo: 'ORDER-20260603-001',
          channel: 'wechat',
          totalAmount: 13980,
          welfareCardPayableAmount: 5000,
          cashPayableAmount: 8980
        })
      ).rejects.toBeInstanceOf(ConflictException);

      expect(repository.createPayment).not.toHaveBeenCalled();
    }
  );

  it('returns existing payment for the same idempotent request', async () => {
    const { repository, service } = createServiceFixture();
    repository.findPaymentByRequestId.mockResolvedValue(paymentRecord);

    const result = await service.createPayment({
      requestId: 'request-001',
      orderNo: 'ORDER-20260603-001',
      channel: 'wechat',
      totalAmount: 13980,
      welfareCardPayableAmount: 5000,
      cashPayableAmount: 8980
    });

    expect(repository.createPayment).not.toHaveBeenCalled();
    expect(result).toEqual({ idempotentReplay: true, payment: paymentRecord });
  });

  it('rejects a reused request ID with different payment amount', async () => {
    const { repository, service } = createServiceFixture();
    repository.findPaymentByRequestId.mockResolvedValue(paymentRecord);

    await expect(
      service.createPayment({
        requestId: 'request-001',
        orderNo: 'ORDER-20260603-001',
        channel: 'wechat',
        totalAmount: 13980,
        welfareCardPayableAmount: 3000,
        cashPayableAmount: 10980
      })
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('processes payment callback through repository idempotency', async () => {
    const { repository, settlementRepository, service } = createServiceFixture();

    const result = await service.processCallback({
      providerEventId: 'event-001',
      paymentNo: 'PAY-20260603-001',
      providerPaymentNo: 'wx-pay-001',
      status: 'paid',
      paidAt: new Date('2026-06-03T00:05:00.000Z'),
      payload: { event: 'paid' }
    });

    expect(repository.processCallback).toHaveBeenCalledWith({
      providerEventId: 'event-001',
      paymentNo: 'PAY-20260603-001',
      providerPaymentNo: 'wx-pay-001',
      status: 'paid',
      paidAt: new Date('2026-06-03T00:05:00.000Z'),
      payload: { event: 'paid' }
    });
    expect(result).toEqual(expect.objectContaining({ duplicate: false }));
    expect(settlementRepository.generateMerchantBillItemsForPaidOrder).toHaveBeenCalledWith('ORDER-20260603-001');
  });

  it('does not generate settlement bill items for duplicate callbacks', async () => {
    const { repository, settlementRepository, service } = createServiceFixture();
    repository.processCallback.mockResolvedValue({
      duplicate: true,
      payment: { ...paymentRecord, status: 'paid', providerPaymentNo: 'wx-pay-001' },
      callback: {
        id: 'callback-001',
        paymentNo: paymentRecord.paymentNo,
        providerEventId: 'event-001',
        status: 'paid'
      }
    });

    await service.processCallback({
      providerEventId: 'event-001',
      paymentNo: 'PAY-20260603-001',
      providerPaymentNo: 'wx-pay-001',
      status: 'paid',
      paidAt: new Date('2026-06-03T00:05:00.000Z'),
      payload: { event: 'paid' }
    });

    expect(settlementRepository.generateMerchantBillItemsForPaidOrder).not.toHaveBeenCalled();
  });

  it('does not generate settlement bill items for failed callbacks', async () => {
    const { repository, settlementRepository, service } = createServiceFixture();
    repository.processCallback.mockResolvedValue({
      duplicate: false,
      payment: { ...paymentRecord, status: 'failed', providerPaymentNo: 'wx-pay-001' },
      callback: {
        id: 'callback-001',
        paymentNo: paymentRecord.paymentNo,
        providerEventId: 'event-001',
        status: 'failed'
      }
    });

    await service.processCallback({
      providerEventId: 'event-001',
      paymentNo: 'PAY-20260603-001',
      providerPaymentNo: 'wx-pay-001',
      status: 'failed',
      paidAt: null,
      payload: { event: 'failed' }
    });

    expect(settlementRepository.generateMerchantBillItemsForPaidOrder).not.toHaveBeenCalled();
  });

  it('returns not found when callback references a missing payment', async () => {
    const { repository, service } = createServiceFixture();
    repository.processCallback.mockResolvedValue(null);

    await expect(
      service.processCallback({
        providerEventId: 'event-001',
        paymentNo: 'PAY-MISSING',
        providerPaymentNo: 'wx-pay-001',
        status: 'paid',
        paidAt: new Date('2026-06-03T00:05:00.000Z'),
        payload: { event: 'paid' }
      })
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
