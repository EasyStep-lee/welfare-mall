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

const statement = {
  statementNo: 'MSS-20260606-001',
  merchantId: 'merchant-001',
  status: 'generated',
  itemCount: 1,
  grossAmount: 13980,
  refundOffsetAmount: 0,
  adjustmentAmount: 0,
  netAmount: 13980,
  items: [billItem]
};

const paidStatement = {
  ...statement,
  status: 'paid_offline',
  paidAt: '2026-06-07T00:00:00.000Z',
  payoutReference: 'BANK-20260607-001',
  payoutRemark: 'June welfare payout',
  items: [{ ...billItem, status: 'paid_offline' }]
};

function createSettlementServiceMock() {
  return {
    generateMerchantBillItems: jest.fn().mockResolvedValue({ items: [billItem] }),
    listMerchantBillItems: jest.fn().mockResolvedValue({ items: [billItem] }),
    generateMerchantSettlementStatement: jest.fn().mockResolvedValue({ statement }),
    confirmMerchantSettlementStatementOfflinePayout: jest.fn().mockResolvedValue({ statement: paidStatement }),
    listMerchantSettlementStatements: jest.fn().mockResolvedValue({ statements: [statement] })
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

  it('generates a merchant settlement statement', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/settlements/merchant-statements/generate')
      .send({ merchantId: ' merchant-001 ' })
      .expect(201);

    expect(settlementService.generateMerchantSettlementStatement).toHaveBeenCalledWith({
      merchantId: ' merchant-001 '
    });
    expect(response.body.statement).toEqual(statement);
  });

  it('lists merchant settlement statements by filters', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/settlements/merchant-statements?merchantId=merchant-001&status=generated')
      .expect(200);

    expect(settlementService.listMerchantSettlementStatements).toHaveBeenCalledWith({
      merchantId: 'merchant-001',
      status: 'generated'
    });
    expect(response.body.statements).toEqual([statement]);
  });

  it('confirms a merchant settlement statement offline payout', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/settlements/merchant-statements/MSS-20260606-001/confirm-offline-payout')
      .send({
        paidAt: '2026-06-07T00:00:00.000Z',
        payoutReference: ' BANK-20260607-001 ',
        payoutRemark: ' June welfare payout '
      })
      .expect(201);

    expect(settlementService.confirmMerchantSettlementStatementOfflinePayout).toHaveBeenCalledWith({
      statementNo: 'MSS-20260606-001',
      paidAt: '2026-06-07T00:00:00.000Z',
      payoutReference: ' BANK-20260607-001 ',
      payoutRemark: ' June welfare payout '
    });
    expect(response.body.statement).toEqual(paidStatement);
  });
});
