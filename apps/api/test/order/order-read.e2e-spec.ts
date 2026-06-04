import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { OrderReadService } from '../../src/order/order-read.service';

function createOrderReadServiceMock() {
  return {
    listOrders: jest.fn(),
    listAdminOrders: jest.fn(),
    getOrderDetail: jest.fn()
  };
}

describe('Order read API contract', () => {
  let app: INestApplication;
  let orderReadService: ReturnType<typeof createOrderReadServiceMock>;

  beforeEach(async () => {
    orderReadService = createOrderReadServiceMock();
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(OrderReadService)
      .useValue(orderReadService)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('lists orders for one buyer', async () => {
    orderReadService.listOrders.mockResolvedValue({
      orders: [
        {
          orderNo: 'ORDER-20260603-001',
          buyerUserId: 'user-001',
          status: 'pending_payment',
          totalAmount: 13980,
          latestPayment: {
            paymentNo: 'PAY-20260603-001',
            status: 'pending',
            channel: 'wechat'
          },
          latestRefund: {
            refundNo: 'REF-20260603-001',
            status: 'processing',
            channel: 'wechat',
            refundAmount: 13980,
            reason: 'after_sale'
          },
          lines: [{ displayName: 'Local Rice', quantity: 2 }]
        }
      ]
    });

    const response = await request(app.getHttpServer()).get('/api/orders?buyerUserId=user-001').expect(200);

    expect(orderReadService.listOrders).toHaveBeenCalledWith({ buyerUserId: 'user-001' });
    expect(response.body.orders).toHaveLength(1);
    expect(response.body.orders[0].orderNo).toBe('ORDER-20260603-001');
    expect(response.body.orders[0].latestPayment).toMatchObject({
      paymentNo: 'PAY-20260603-001',
      status: 'pending',
      channel: 'wechat'
    });
    expect(response.body.orders[0].latestRefund).toMatchObject({
      refundNo: 'REF-20260603-001',
      status: 'processing',
      channel: 'wechat',
      refundAmount: 13980,
      reason: 'after_sale'
    });
  });

  it('lists recent orders for Admin order management', async () => {
    orderReadService.listAdminOrders.mockResolvedValue({
      orders: [
        {
          orderNo: 'ORDER-20260603-001',
          buyerUserId: 'user-001',
          status: 'paid',
          totalAmount: 13980,
          receiverName: 'Li Lei',
          receiverPhone: '13800000000',
          latestPayment: {
            paymentNo: 'PAY-20260603-001',
            status: 'paid',
            channel: 'wechat'
          },
          latestRefund: {
            refundNo: 'REF-20260603-001',
            status: 'processing',
            channel: 'wechat',
            refundAmount: 13980,
            reason: 'after_sale'
          },
          lines: [{ displayName: 'Local Rice', quantity: 2 }]
        }
      ]
    });

    const response = await request(app.getHttpServer()).get('/api/orders/admin').expect(200);

    expect(orderReadService.listAdminOrders).toHaveBeenCalledWith({});
    expect(orderReadService.getOrderDetail).not.toHaveBeenCalled();
    expect(response.body.orders).toHaveLength(1);
    expect(response.body.orders[0]).toMatchObject({
      orderNo: 'ORDER-20260603-001',
      buyerUserId: 'user-001',
      status: 'paid',
      totalAmount: 13980,
      latestPayment: {
        paymentNo: 'PAY-20260603-001',
        status: 'paid',
        channel: 'wechat'
      },
      latestRefund: {
        refundNo: 'REF-20260603-001',
        status: 'processing',
        channel: 'wechat',
        refundAmount: 13980,
        reason: 'after_sale'
      }
    });
  });

  it('filters recent Admin orders by status', async () => {
    orderReadService.listAdminOrders.mockResolvedValue({
      orders: [
        {
          orderNo: 'ORDER-20260603-002',
          buyerUserId: 'user-002',
          status: 'refund_processing',
          totalAmount: 6990,
          latestPayment: {
            paymentNo: 'PAY-20260603-002',
            status: 'paid',
            channel: 'wechat'
          },
          latestRefund: {
            refundNo: 'REF-20260603-002',
            status: 'processing',
            channel: 'wechat',
            refundAmount: 6990,
            reason: 'after_sale'
          },
          lines: [{ displayName: 'Local Rice', quantity: 1 }]
        }
      ]
    });

    const response = await request(app.getHttpServer()).get('/api/orders/admin?status=refund_processing').expect(200);

    expect(orderReadService.listAdminOrders).toHaveBeenCalledWith({ status: 'refund_processing' });
    expect(response.body.orders).toHaveLength(1);
    expect(response.body.orders[0]).toMatchObject({
      orderNo: 'ORDER-20260603-002',
      status: 'refund_processing'
    });
  });

  it('gets one buyer-scoped order detail', async () => {
    orderReadService.getOrderDetail.mockResolvedValue({
      order: {
        orderNo: 'ORDER-20260603-001',
        buyerUserId: 'user-001',
        status: 'pending_payment',
        totalAmount: 13980,
        latestPayment: {
          paymentNo: 'PAY-20260603-001',
          status: 'pending',
          channel: 'wechat'
        },
        latestRefund: {
          refundNo: 'REF-20260603-001',
          status: 'processing',
          channel: 'wechat',
          refundAmount: 13980,
          reason: 'after_sale'
        },
        lines: [{ displayName: 'Local Rice', quantity: 2 }]
      }
    });

    const response = await request(app.getHttpServer())
      .get('/api/orders/ORDER-20260603-001?buyerUserId=user-001')
      .expect(200);

    expect(orderReadService.getOrderDetail).toHaveBeenCalledWith({
      buyerUserId: 'user-001',
      orderNo: 'ORDER-20260603-001'
    });
    expect(response.body.order.orderNo).toBe('ORDER-20260603-001');
    expect(response.body.order.latestPayment).toMatchObject({
      paymentNo: 'PAY-20260603-001',
      status: 'pending',
      channel: 'wechat'
    });
    expect(response.body.order.latestRefund).toMatchObject({
      refundNo: 'REF-20260603-001',
      status: 'processing',
      channel: 'wechat',
      refundAmount: 13980,
      reason: 'after_sale'
    });
  });

  it('rejects blank buyer ID before calling service', async () => {
    await request(app.getHttpServer()).get('/api/orders?buyerUserId=').expect(400);

    expect(orderReadService.listOrders).not.toHaveBeenCalled();
  });
});
