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

  it('filters recent Admin orders by status and fulfillment progress', async () => {
    orderReadService.listAdminOrders.mockResolvedValue({
      orders: [
        {
          orderNo: 'ORDER-20260603-003',
          buyerUserId: 'user-003',
          status: 'paid',
          totalAmount: 15990,
          fulfillmentSummary: {
            totalTasks: 2,
            pendingTasks: 1,
            completedTasks: 1,
            taskNos: ['FT-ORDER-20260603-003-MERCHANT-001-001', 'FT-ORDER-20260603-003-MERCHANT-002-001']
          },
          lines: [{ displayName: 'Local Rice', quantity: 1 }]
        }
      ]
    });

    const response = await request(app.getHttpServer())
      .get('/api/orders/admin?status=paid&fulfillmentStatus=pending')
      .expect(200);

    expect(orderReadService.listAdminOrders).toHaveBeenCalledWith({
      status: 'paid',
      fulfillmentStatus: 'pending'
    });
    expect(response.body.orders).toHaveLength(1);
    expect(response.body.orders[0]).toMatchObject({
      orderNo: 'ORDER-20260603-003',
      status: 'paid',
      fulfillmentSummary: {
        totalTasks: 2,
        pendingTasks: 1,
        completedTasks: 1
      }
    });
  });

  it('filters recent Admin orders by status, fulfillment progress, and merchant', async () => {
    orderReadService.listAdminOrders.mockResolvedValue({
      orders: [
        {
          orderNo: 'ORDER-20260603-004',
          buyerUserId: 'user-004',
          status: 'paid',
          totalAmount: 25990,
          fulfillmentSummary: {
            totalTasks: 1,
            pendingTasks: 1,
            completedTasks: 0,
            taskNos: ['FT-ORDER-20260603-004-MERCHANT-001-001']
          },
          fulfillmentTasks: [
            {
              taskNo: 'FT-ORDER-20260603-004-MERCHANT-001-001',
              merchantId: 'merchant-001',
              status: 'pending'
            }
          ],
          lines: [{ displayName: 'Local Rice', quantity: 1 }]
        }
      ]
    });

    const response = await request(app.getHttpServer())
      .get('/api/orders/admin?status=paid&fulfillmentStatus=pending&merchantId=merchant-001')
      .expect(200);

    expect(orderReadService.listAdminOrders).toHaveBeenCalledWith({
      status: 'paid',
      fulfillmentStatus: 'pending',
      merchantId: 'merchant-001'
    });
    expect(response.body.orders).toHaveLength(1);
    expect(response.body.orders[0]).toMatchObject({
      orderNo: 'ORDER-20260603-004',
      fulfillmentTasks: [
        {
          merchantId: 'merchant-001',
          status: 'pending'
        }
      ]
    });
  });

  it('filters recent Admin orders by status, fulfillment progress, merchant, and task number', async () => {
    orderReadService.listAdminOrders.mockResolvedValue({
      orders: [
        {
          orderNo: 'ORDER-20260603-005',
          buyerUserId: 'user-005',
          status: 'paid',
          totalAmount: 35990,
          fulfillmentSummary: {
            totalTasks: 1,
            pendingTasks: 1,
            completedTasks: 0,
            taskNos: ['FT-ORDER-20260603-005-MERCHANT-001-001']
          },
          fulfillmentTasks: [
            {
              taskNo: 'FT-ORDER-20260603-005-MERCHANT-001-001',
              merchantId: 'merchant-001',
              status: 'pending'
            }
          ],
          lines: [{ displayName: 'Local Rice', quantity: 1 }]
        }
      ]
    });

    const response = await request(app.getHttpServer())
      .get(
        '/api/orders/admin?status=paid&fulfillmentStatus=pending&merchantId=merchant-001&taskNo=FT-ORDER-20260603-005-MERCHANT-001-001'
      )
      .expect(200);

    expect(orderReadService.listAdminOrders).toHaveBeenCalledWith({
      status: 'paid',
      fulfillmentStatus: 'pending',
      merchantId: 'merchant-001',
      taskNo: 'FT-ORDER-20260603-005-MERCHANT-001-001'
    });
    expect(response.body.orders).toHaveLength(1);
    expect(response.body.orders[0]).toMatchObject({
      orderNo: 'ORDER-20260603-005',
      fulfillmentTasks: [
        {
          taskNo: 'FT-ORDER-20260603-005-MERCHANT-001-001',
          merchantId: 'merchant-001',
          status: 'pending'
        }
      ]
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
