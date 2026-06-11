import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { OrderCheckoutService } from '../../src/order/order-checkout.service';

function createOrderCheckoutServiceMock() {
  return {
    createOrder: jest.fn()
  };
}

describe('Order checkout API contract', () => {
  let app: INestApplication;
  let orderCheckoutService: ReturnType<typeof createOrderCheckoutServiceMock>;

  beforeEach(async () => {
    orderCheckoutService = createOrderCheckoutServiceMock();
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(OrderCheckoutService)
      .useValue(orderCheckoutService)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('creates an order from checkout items and fulfillment info', async () => {
    orderCheckoutService.createOrder.mockResolvedValue({
      idempotentReplay: false,
      order: {
        orderNo: 'ORDER-20260603-001',
        requestId: 'checkout-request-001',
        buyerUserId: 'user-001',
        status: 'pending_payment',
        totalAmount: 13980,
        welfareCardPayableAmount: 5000,
        cashPayableAmount: 8980,
        lines: [
          {
            productPoolItemId: 'pool-item-001',
            displayName: '东北五常大米福利装',
            quantity: 2,
            lineTotalAmount: 13980
          }
        ]
      }
    });

    const response = await request(app.getHttpServer())
      .post('/api/orders')
      .send({
        requestId: 'checkout-request-001',
        buyerUserId: 'user-001',
        items: [{ productPoolItemId: 'pool-item-001', quantity: 2 }],
        welfareCardPaymentAmount: 5000,
        fulfillment: {
          type: 'delivery',
          receiverName: '李雷',
          receiverPhone: '13800000000',
          receiverAddress: '上海市浦东新区世纪大道 1 号'
        }
      })
      .expect(201);

    expect(orderCheckoutService.createOrder).toHaveBeenCalledWith({
      requestId: 'checkout-request-001',
      buyerUserId: 'user-001',
      items: [{ productPoolItemId: 'pool-item-001', quantity: 2 }],
      welfareCardPaymentAmount: 5000,
      fulfillment: {
        type: 'delivery',
        receiverName: '李雷',
        receiverPhone: '13800000000',
        receiverAddress: '上海市浦东新区世纪大道 1 号',
        pickupStoreName: null
      }
    });
    expect(response.body.order.orderNo).toBe('ORDER-20260603-001');
  });

  it('uses JWT buyer identity when creating an order and ignores conflicting body buyer ID', async () => {
    orderCheckoutService.createOrder.mockResolvedValue({
      idempotentReplay: false,
      order: {
        orderNo: 'ORDER-20260603-002',
        requestId: 'checkout-request-002',
        buyerUserId: 'user-001',
        status: 'pending_payment',
        totalAmount: 13980,
        welfareCardPayableAmount: 0,
        cashPayableAmount: 13980,
        lines: []
      }
    });
    const token = await loginAndGetToken(app, 'buyer-local');

    await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        requestId: 'checkout-request-002',
        buyerUserId: 'attacker-user',
        items: [{ productPoolItemId: 'pool-item-001', quantity: 2 }],
        fulfillment: {
          type: 'delivery',
          receiverName: '李雷',
          receiverPhone: '13800000000',
          receiverAddress: '上海市浦东新区世纪大道 1 号'
        }
      })
      .expect(201);

    expect(orderCheckoutService.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'checkout-request-002',
        buyerUserId: 'user-001'
      })
    );
  });

  it('creates a pickup order without legacy pickup-store input', async () => {
    orderCheckoutService.createOrder.mockResolvedValue({
      idempotentReplay: false,
      order: {
        orderNo: 'ORDER-20260603-003',
        requestId: 'checkout-request-003',
        buyerUserId: 'user-001',
        status: 'pending_payment',
        totalAmount: 6990,
        welfareCardPayableAmount: 0,
        cashPayableAmount: 6990,
        fulfillmentType: 'pickup',
        pickupStoreName: null,
        fulfillmentMerchantAddress: '上海市浦东新区世纪大道 88 号',
        lines: []
      }
    });

    await request(app.getHttpServer())
      .post('/api/orders')
      .send({
        requestId: 'checkout-request-003',
        buyerUserId: 'user-001',
        items: [{ productPoolItemId: 'pool-item-001', quantity: 1 }],
        fulfillment: {
          type: 'pickup'
        }
      })
      .expect(201);

    expect(orderCheckoutService.createOrder).toHaveBeenCalledWith({
      requestId: 'checkout-request-003',
      buyerUserId: 'user-001',
      items: [{ productPoolItemId: 'pool-item-001', quantity: 1 }],
      welfareCardPaymentAmount: undefined,
      fulfillment: {
        type: 'pickup',
        receiverName: null,
        receiverPhone: null,
        receiverAddress: null,
        pickupStoreName: null
      }
    });
  });

  it('rejects invalid checkout request fields before calling service', async () => {
    await request(app.getHttpServer())
      .post('/api/orders')
      .send({
        requestId: 'checkout-request-001',
        buyerUserId: ' ',
        items: [{ productPoolItemId: 'pool-item-001', quantity: 2 }],
        fulfillment: {
          type: 'delivery',
          receiverName: '李雷',
          receiverPhone: '13800000000',
          receiverAddress: '上海市浦东新区世纪大道 1 号'
        }
      })
      .expect(400);

    expect(orderCheckoutService.createOrder).not.toHaveBeenCalled();
  });
});

async function loginAndGetToken(app: INestApplication, username: string) {
  const response = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ username, password: 'local-dev-password' })
    .expect(201);

  return response.body.accessToken as string;
}
