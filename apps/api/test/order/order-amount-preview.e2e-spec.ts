import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { OrderAmountService } from '../../src/order/order-amount.service';

function createOrderAmountServiceMock() {
  return {
    previewAmount: jest.fn()
  };
}

describe('Order amount preview API contract', () => {
  let app: INestApplication;
  let orderAmountService: ReturnType<typeof createOrderAmountServiceMock>;

  beforeEach(async () => {
    orderAmountService = createOrderAmountServiceMock();
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(OrderAmountService)
      .useValue(orderAmountService)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('returns the order status catalog', async () => {
    const response = await request(app.getHttpServer()).get('/api/orders/statuses').expect(200);

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'draft', name: '草稿' }),
        expect.objectContaining({ code: 'pending_payment', name: '待支付' }),
        expect.objectContaining({ code: 'paid', name: '已支付' })
      ])
    );
  });

  it('previews order amount from product pool item IDs and quantities', async () => {
    orderAmountService.previewAmount.mockResolvedValue({
      lines: [
        {
          productPoolItemId: 'pool-item-001',
          productId: 'product-001',
          skuId: 'sku-001',
          displayName: '东北五常大米福利装',
          displaySkuCode: 'SKU-RICE-5KG',
          displayImageUrl: 'https://cdn.example.com/products/rice-main.jpg',
          unitPriceAmount: 6990,
          quantity: 2,
          lineTotalAmount: 13980
        }
      ],
      subtotalAmount: 13980,
      discountAmount: 0,
      totalAmount: 13980,
      welfareCardPayableAmount: 5000,
      cashPayableAmount: 8980
    });

    const response = await request(app.getHttpServer())
      .post('/api/orders/amount-preview')
      .send({ items: [{ productPoolItemId: 'pool-item-001', quantity: 2 }], welfareCardPaymentAmount: 5000 })
      .expect(200);

    expect(orderAmountService.previewAmount).toHaveBeenCalledWith({
      items: [{ productPoolItemId: 'pool-item-001', quantity: 2 }],
      welfareCardPaymentAmount: 5000
    });
    expect(response.body.totalAmount).toBe(13980);
    expect(response.body.welfareCardPayableAmount).toBe(5000);
    expect(response.body.cashPayableAmount).toBe(8980);
  });

  it('rejects invalid amount preview request fields before calling service', async () => {
    await request(app.getHttpServer())
      .post('/api/orders/amount-preview')
      .send({ items: [{ productPoolItemId: ' ', quantity: 2 }] })
      .expect(400);

    expect(orderAmountService.previewAmount).not.toHaveBeenCalled();
  });

  it('rejects invalid welfare-card amount before calling service', async () => {
    await request(app.getHttpServer())
      .post('/api/orders/amount-preview')
      .send({ items: [{ productPoolItemId: 'pool-item-001', quantity: 2 }], welfareCardPaymentAmount: -1 })
      .expect(400);

    expect(orderAmountService.previewAmount).not.toHaveBeenCalled();
  });
});
