import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { OrderRefundService } from '../../src/order/order-refund.service';

function createOrderRefundServiceMock() {
  return {
    createRefund: jest.fn(),
    processCallback: jest.fn()
  };
}

describe('Order refund API contract', () => {
  let app: INestApplication;
  let orderRefundService: ReturnType<typeof createOrderRefundServiceMock>;

  beforeEach(async () => {
    orderRefundService = createOrderRefundServiceMock();
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(OrderRefundService)
      .useValue(orderRefundService)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('creates a refund order', async () => {
    orderRefundService.createRefund.mockResolvedValue({
      idempotentReplay: false,
      refund: {
        refundNo: 'REF-20260603-001',
        requestId: 'refund-request-001',
        paymentNo: 'PAY-20260603-001',
        orderNo: 'ORDER-20260603-001',
        status: 'processing',
        channel: 'wechat',
        refundAmount: 5000,
        reason: 'user_cancel'
      }
    });

    const response = await request(app.getHttpServer())
      .post('/api/orders/refunds')
      .send({
        requestId: 'refund-request-001',
        paymentNo: 'PAY-20260603-001',
        orderNo: 'ORDER-20260603-001',
        channel: 'wechat',
        refundAmount: 5000,
        reason: 'user_cancel'
      })
      .expect(201);

    expect(orderRefundService.createRefund).toHaveBeenCalledWith({
      requestId: 'refund-request-001',
      paymentNo: 'PAY-20260603-001',
      orderNo: 'ORDER-20260603-001',
      channel: 'wechat',
      refundAmount: 5000,
      reason: 'user_cancel'
    });
    expect(response.body.refund.refundNo).toBe('REF-20260603-001');
  });

  it('rejects invalid refund amount before calling service', async () => {
    await request(app.getHttpServer())
      .post('/api/orders/refunds')
      .send({
        requestId: 'refund-request-001',
        paymentNo: 'PAY-20260603-001',
        orderNo: 'ORDER-20260603-001',
        channel: 'wechat',
        refundAmount: 0,
        reason: 'user_cancel'
      })
      .expect(400);

    expect(orderRefundService.createRefund).not.toHaveBeenCalled();
  });

  it('rejects offline cash refund channel before calling service', async () => {
    await request(app.getHttpServer())
      .post('/api/orders/refunds')
      .send({
        requestId: 'refund-request-001',
        paymentNo: 'PAY-20260603-001',
        orderNo: 'ORDER-20260603-001',
        channel: 'cash',
        refundAmount: 5000,
        reason: 'user_cancel'
      })
      .expect(400);

    expect(orderRefundService.createRefund).not.toHaveBeenCalled();
  });

  it('processes a refund callback', async () => {
    orderRefundService.processCallback.mockResolvedValue({
      duplicate: false,
      refund: {
        refundNo: 'REF-20260603-001',
        status: 'succeeded',
        providerRefundNo: 'wx-refund-001'
      },
      callback: {
        providerEventId: 'refund-event-001',
        status: 'succeeded'
      }
    });

    const response = await request(app.getHttpServer())
      .post('/api/orders/refunds/callbacks')
      .send({
        providerEventId: 'refund-event-001',
        refundNo: 'REF-20260603-001',
        providerRefundNo: 'wx-refund-001',
        status: 'succeeded',
        succeededAt: '2026-06-03T00:15:00.000Z',
        payload: { event: 'refund.succeeded' }
      })
      .expect(200);

    expect(orderRefundService.processCallback).toHaveBeenCalledWith({
      providerEventId: 'refund-event-001',
      refundNo: 'REF-20260603-001',
      providerRefundNo: 'wx-refund-001',
      status: 'succeeded',
      succeededAt: new Date('2026-06-03T00:15:00.000Z'),
      payload: { event: 'refund.succeeded' }
    });
    expect(response.body.duplicate).toBe(false);
  });
});
