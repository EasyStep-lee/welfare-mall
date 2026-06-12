import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { OrderPaymentService } from '../../src/order/order-payment.service';

function createOrderPaymentServiceMock() {
  return {
    createPayment: jest.fn(),
    processCallback: jest.fn()
  };
}

describe('Order payment API contract', () => {
  let app: INestApplication;
  let orderPaymentService: ReturnType<typeof createOrderPaymentServiceMock>;

  beforeEach(async () => {
    orderPaymentService = createOrderPaymentServiceMock();
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(OrderPaymentService)
      .useValue(orderPaymentService)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('creates a payment order', async () => {
    orderPaymentService.createPayment.mockResolvedValue({
      idempotentReplay: false,
      payment: {
        paymentNo: 'PAY-20260603-001',
        requestId: 'request-001',
        orderNo: 'ORDER-20260603-001',
        status: 'pending',
        channel: 'wechat',
        totalAmount: 13980,
        welfareCardPayableAmount: 5000,
        cashPayableAmount: 8980
      }
    });

    const response = await request(app.getHttpServer())
      .post('/api/orders/payments')
      .send({
        requestId: 'request-001',
        orderNo: 'ORDER-20260603-001',
        channel: 'wechat',
        totalAmount: 13980,
        welfareCardPayableAmount: 5000,
        cashPayableAmount: 8980,
        welfareCardAccountId: 'wca-001'
      })
      .expect(201);

    expect(orderPaymentService.createPayment).toHaveBeenCalledWith({
      requestId: 'request-001',
      orderNo: 'ORDER-20260603-001',
      channel: 'wechat',
      totalAmount: 13980,
      welfareCardPayableAmount: 5000,
      cashPayableAmount: 8980,
      welfareCardAccountId: 'wca-001'
    });
    expect(response.body.payment.paymentNo).toBe('PAY-20260603-001');
  });

  it('rejects invalid payment amount fields before calling service', async () => {
    await request(app.getHttpServer())
      .post('/api/orders/payments')
      .send({
        requestId: 'request-001',
        orderNo: 'ORDER-20260603-001',
        channel: 'wechat',
        totalAmount: 13980,
        welfareCardPayableAmount: 5000,
        cashPayableAmount: 8000
      })
      .expect(400);

    expect(orderPaymentService.createPayment).not.toHaveBeenCalled();
  });

  it('rejects offline cash payment channel before calling service', async () => {
    await request(app.getHttpServer())
      .post('/api/orders/payments')
      .send({
        requestId: 'request-001',
        orderNo: 'ORDER-20260603-001',
        channel: 'cash',
        totalAmount: 13980,
        welfareCardPayableAmount: 5000,
        cashPayableAmount: 8980
      })
      .expect(400);

    expect(orderPaymentService.createPayment).not.toHaveBeenCalled();
  });

  it('processes a payment callback', async () => {
    orderPaymentService.processCallback.mockResolvedValue({
      duplicate: false,
      payment: {
        paymentNo: 'PAY-20260603-001',
        status: 'paid',
        providerPaymentNo: 'wx-pay-001'
      },
      callback: {
        providerEventId: 'event-001',
        status: 'paid'
      }
    });

    const response = await request(app.getHttpServer())
      .post('/api/orders/payments/callbacks')
      .send({
        providerEventId: 'event-001',
        paymentNo: 'PAY-20260603-001',
        providerPaymentNo: 'wx-pay-001',
        status: 'paid',
        paidAt: '2026-06-03T00:05:00.000Z',
        payload: { event: 'paid' }
      })
      .expect(200);

    expect(orderPaymentService.processCallback).toHaveBeenCalledWith({
      providerEventId: 'event-001',
      paymentNo: 'PAY-20260603-001',
      providerPaymentNo: 'wx-pay-001',
      status: 'paid',
      paidAt: new Date('2026-06-03T00:05:00.000Z'),
      payload: { event: 'paid' }
    });
    expect(response.body.duplicate).toBe(false);
  });
});
