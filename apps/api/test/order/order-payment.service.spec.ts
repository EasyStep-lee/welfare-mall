import { ConflictException, NotFoundException } from '@nestjs/common';
import { OrderPaymentRepository } from '../../src/order/order-payment.repository';
import { OrderPaymentService } from '../../src/order/order-payment.service';

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

describe('OrderPaymentService', () => {
  it('creates a pending payment order', async () => {
    const repository = createRepositoryMock();
    const service = new OrderPaymentService(repository as unknown as OrderPaymentRepository);

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

  it('returns existing payment for the same idempotent request', async () => {
    const repository = createRepositoryMock();
    repository.findPaymentByRequestId.mockResolvedValue(paymentRecord);
    const service = new OrderPaymentService(repository as unknown as OrderPaymentRepository);

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
    const repository = createRepositoryMock();
    repository.findPaymentByRequestId.mockResolvedValue(paymentRecord);
    const service = new OrderPaymentService(repository as unknown as OrderPaymentRepository);

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
    const repository = createRepositoryMock();
    const service = new OrderPaymentService(repository as unknown as OrderPaymentRepository);

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
  });

  it('returns not found when callback references a missing payment', async () => {
    const repository = createRepositoryMock();
    repository.processCallback.mockResolvedValue(null);
    const service = new OrderPaymentService(repository as unknown as OrderPaymentRepository);

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
