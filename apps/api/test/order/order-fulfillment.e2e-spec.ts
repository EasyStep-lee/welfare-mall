import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { OrderFulfillmentService } from '../../src/order/order-fulfillment.service';

function createOrderFulfillmentServiceMock() {
  return {
    listMerchantFulfillmentOrders: jest.fn(),
    completeMerchantFulfillmentOrder: jest.fn()
  };
}

describe('Merchant fulfillment order API contract', () => {
  let app: INestApplication;
  let orderFulfillmentService: ReturnType<typeof createOrderFulfillmentServiceMock>;

  beforeEach(async () => {
    orderFulfillmentService = createOrderFulfillmentServiceMock();
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(OrderFulfillmentService)
      .useValue(orderFulfillmentService)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('lists paid fulfillment orders for one merchant', async () => {
    orderFulfillmentService.listMerchantFulfillmentOrders.mockResolvedValue({
      orders: [
        {
          orderNo: 'ORDER-20260603-001',
          status: 'paid',
          totalAmount: 13980,
          receiverName: 'Li Lei',
          receiverPhone: '13800000000',
          receiverAddress: 'Pudong Avenue 1',
          latestPayment: {
            paymentNo: 'PAY-20260603-001',
            status: 'paid',
            channel: 'wechat'
          },
          lines: [{ displayName: 'Local Rice', quantity: 2 }]
        }
      ]
    });

    const response = await request(app.getHttpServer())
      .get('/api/orders/merchant/fulfillment?merchantId=merchant-001')
      .expect(200);

    expect(orderFulfillmentService.listMerchantFulfillmentOrders).toHaveBeenCalledWith({
      merchantId: 'merchant-001',
      status: 'paid'
    });
    expect(response.body.orders).toHaveLength(1);
    expect(response.body.orders[0]).toMatchObject({
      orderNo: 'ORDER-20260603-001',
      status: 'paid',
      latestPayment: {
        paymentNo: 'PAY-20260603-001',
        status: 'paid',
        channel: 'wechat'
      }
    });
  });

  it('filters merchant fulfillment orders by status', async () => {
    orderFulfillmentService.listMerchantFulfillmentOrders.mockResolvedValue({
      orders: [
        {
          orderNo: 'ORDER-20260603-002',
          status: 'completed',
          totalAmount: 13980,
          receiverName: 'Han Mei',
          receiverPhone: '13900000000',
          receiverAddress: 'Nanjing Road 2',
          latestPayment: {
            paymentNo: 'PAY-20260603-002',
            status: 'paid',
            channel: 'wechat'
          },
          lines: [{ displayName: 'Local Rice', quantity: 2 }]
        }
      ]
    });

    const response = await request(app.getHttpServer())
      .get('/api/orders/merchant/fulfillment?merchantId=merchant-001&status=completed')
      .expect(200);

    expect(orderFulfillmentService.listMerchantFulfillmentOrders).toHaveBeenCalledWith({
      merchantId: 'merchant-001',
      status: 'completed'
    });
    expect(response.body.orders).toHaveLength(1);
    expect(response.body.orders[0]).toMatchObject({
      orderNo: 'ORDER-20260603-002',
      status: 'completed'
    });
  });

  it('rejects blank merchant ID before calling service', async () => {
    await request(app.getHttpServer()).get('/api/orders/merchant/fulfillment?merchantId=').expect(400);

    expect(orderFulfillmentService.listMerchantFulfillmentOrders).not.toHaveBeenCalled();
  });

  it('completes one merchant fulfillment order', async () => {
    orderFulfillmentService.completeMerchantFulfillmentOrder.mockResolvedValue({
      order: {
        orderNo: 'ORDER-20260603-001',
        status: 'completed',
        totalAmount: 13980,
        lines: [{ displayName: 'Local Rice', quantity: 2 }]
      }
    });

    const response = await request(app.getHttpServer())
      .post('/api/orders/merchant/fulfillment/ORDER-20260603-001/complete')
      .send({ merchantId: 'merchant-001' })
      .expect(200);

    expect(orderFulfillmentService.completeMerchantFulfillmentOrder).toHaveBeenCalledWith({
      merchantId: 'merchant-001',
      orderNo: 'ORDER-20260603-001'
    });
    expect(response.body.order).toMatchObject({
      orderNo: 'ORDER-20260603-001',
      status: 'completed'
    });
  });

  it('rejects blank merchant ID before completing fulfillment', async () => {
    await request(app.getHttpServer())
      .post('/api/orders/merchant/fulfillment/ORDER-20260603-001/complete')
      .send({ merchantId: ' ' })
      .expect(400);

    expect(orderFulfillmentService.completeMerchantFulfillmentOrder).not.toHaveBeenCalled();
  });
});
