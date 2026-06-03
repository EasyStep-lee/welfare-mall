import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { OrderReadService } from '../../src/order/order-read.service';

function createOrderReadServiceMock() {
  return {
    listOrders: jest.fn(),
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
          lines: [{ displayName: 'Local Rice', quantity: 2 }]
        }
      ]
    });

    const response = await request(app.getHttpServer()).get('/api/orders?buyerUserId=user-001').expect(200);

    expect(orderReadService.listOrders).toHaveBeenCalledWith({ buyerUserId: 'user-001' });
    expect(response.body.orders).toHaveLength(1);
    expect(response.body.orders[0].orderNo).toBe('ORDER-20260603-001');
  });

  it('gets one buyer-scoped order detail', async () => {
    orderReadService.getOrderDetail.mockResolvedValue({
      order: {
        orderNo: 'ORDER-20260603-001',
        buyerUserId: 'user-001',
        status: 'pending_payment',
        totalAmount: 13980,
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
  });

  it('rejects blank buyer ID before calling service', async () => {
    await request(app.getHttpServer()).get('/api/orders?buyerUserId=').expect(400);

    expect(orderReadService.listOrders).not.toHaveBeenCalled();
  });
});
