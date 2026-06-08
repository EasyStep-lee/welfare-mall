import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { WelfareCardService } from '../../src/franchise/welfare-card.service';

function createWelfareCardServiceMock() {
  return {
    issueWelfareCard: jest.fn()
  };
}

describe('Franchise welfare-card issue API contract', () => {
  let app: INestApplication;
  let welfareCardService: ReturnType<typeof createWelfareCardServiceMock>;

  beforeEach(async () => {
    welfareCardService = createWelfareCardServiceMock();
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(WelfareCardService)
      .useValue(welfareCardService)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('issues a welfare card balance for a buyer under the sales franchise', async () => {
    welfareCardService.issueWelfareCard.mockResolvedValue({
      idempotentReplay: false,
      account: {
        id: 'wca-001',
        accountNo: 'WCA-franchise-local-review-buyer-local',
        franchiseId: 'franchise-local-review',
        buyerUserId: 'buyer-local',
        status: 'active',
        balanceAmount: 20000,
        issuedAmount: 20000
      },
      ledgerEntry: {
        id: 'wcl-001',
        ledgerNo: 'WCL-issue-local-001',
        requestId: 'issue-local-001',
        accountId: 'wca-001',
        franchiseId: 'franchise-local-review',
        buyerUserId: 'buyer-local',
        type: 'issue',
        amount: 20000,
        balanceAfter: 20000
      }
    });

    const response = await request(app.getHttpServer())
      .post('/api/franchises/franchise-local-review/welfare-cards/issue')
      .send({
        requestId: 'issue-local-001',
        buyerUserId: 'buyer-local',
        amount: 20000,
        remark: '本地福利卡发行'
      })
      .expect(201);

    expect(welfareCardService.issueWelfareCard).toHaveBeenCalledWith({
      franchiseId: 'franchise-local-review',
      requestId: 'issue-local-001',
      buyerUserId: 'buyer-local',
      amount: 20000,
      remark: '本地福利卡发行'
    });
    expect(response.body.account.balanceAmount).toBe(20000);
    expect(response.body.ledgerEntry.type).toBe('issue');
  });

  it('rejects invalid issue request fields before calling the service', async () => {
    await request(app.getHttpServer())
      .post('/api/franchises/franchise-local-review/welfare-cards/issue')
      .send({
        requestId: 'issue-local-001',
        buyerUserId: 'buyer-local',
        amount: 0
      })
      .expect(400);

    expect(welfareCardService.issueWelfareCard).not.toHaveBeenCalled();
  });
});
