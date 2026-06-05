import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { SettlementService } from '../../src/settlement/settlement.service';

const billItem = {
  billItemNo: 'MSBI-ORDER-20260605-001-ORDER-LINE-001',
  merchantId: 'merchant-001',
  orderNo: 'ORDER-20260605-001',
  orderLineId: 'order-line-001',
  status: 'pending_settlement',
  grossAmount: 13980,
  netAmount: 13980
};

function createSettlementServiceMock() {
  return {
    generateMerchantBillItems: jest.fn().mockResolvedValue({ items: [billItem] }),
    listMerchantBillItems: jest.fn().mockResolvedValue({ items: [billItem] })
  };
}

describe('Settlement API contract', () => {
  let app: INestApplication;
  let settlementService: ReturnType<typeof createSettlementServiceMock>;

  beforeEach(async () => {
    settlementService = createSettlementServiceMock();
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(SettlementService)
      .useValue(settlementService)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('generates merchant settlement bill items for one paid order', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/settlements/merchant-bills/generate')
      .send({ orderNo: ' ORDER-20260605-001 ' })
      .expect(201);

    expect(settlementService.generateMerchantBillItems).toHaveBeenCalledWith({
      orderNo: ' ORDER-20260605-001 '
    });
    expect(response.body.items).toEqual([billItem]);
  });

  it('lists merchant settlement bill items by filters', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/settlements/merchant-bills?merchantId=merchant-001&status=pending_settlement')
      .expect(200);

    expect(settlementService.listMerchantBillItems).toHaveBeenCalledWith({
      merchantId: 'merchant-001',
      status: 'pending_settlement'
    });
    expect(response.body.items).toEqual([billItem]);
  });
});
