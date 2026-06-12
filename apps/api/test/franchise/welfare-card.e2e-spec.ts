import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { WelfareCardService } from '../../src/franchise/welfare-card.service';

function createWelfareCardServiceMock() {
  return {
    issueWelfareCard: jest.fn(),
    createWelfareCardBatch: jest.fn(),
    bindWelfareCard: jest.fn(),
    listBuyerWelfareCardAccounts: jest.fn()
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
    const token = await loginAndGetToken(app, 'franchise-local');
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
      .set('Authorization', `Bearer ${token}`)
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
    const token = await loginAndGetToken(app, 'franchise-local');

    await request(app.getHttpServer())
      .post('/api/franchises/franchise-local-review/welfare-cards/issue')
      .set('Authorization', `Bearer ${token}`)
      .send({
        requestId: 'issue-local-001',
        buyerUserId: 'buyer-local',
        amount: 0
      })
      .expect(400);

    expect(welfareCardService.issueWelfareCard).not.toHaveBeenCalled();
  });

  it('requires a Bearer token before issuing welfare-card balance', async () => {
    await request(app.getHttpServer())
      .post('/api/franchises/franchise-local-review/welfare-cards/issue')
      .send({
        requestId: 'issue-local-001',
        buyerUserId: 'buyer-local',
        amount: 20000
      })
      .expect(401);

    expect(welfareCardService.issueWelfareCard).not.toHaveBeenCalled();
  });

  it('prevents a franchise user from issuing welfare cards for another franchise', async () => {
    const token = await loginAndGetToken(app, 'franchise-local');

    await request(app.getHttpServer())
      .post('/api/franchises/franchise-other/welfare-cards/issue')
      .set('Authorization', `Bearer ${token}`)
      .send({
        requestId: 'issue-local-001',
        buyerUserId: 'buyer-local',
        amount: 20000
      })
      .expect(403);

    expect(welfareCardService.issueWelfareCard).not.toHaveBeenCalled();
  });

  it('creates an entity welfare-card batch for the authenticated franchise', async () => {
    const token = await loginAndGetToken(app, 'franchise-local');
    welfareCardService.createWelfareCardBatch.mockResolvedValue({
      idempotentReplay: false,
      batch: {
        id: 'wcb-001',
        batchNo: 'WCB-batch-request-001',
        requestId: 'batch-request-001',
        issuerFranchiseId: 'franchise-local-review',
        batchName: '端午福利卡批次',
        faceValueAmount: 5000,
        totalCards: 2,
        totalAmount: 10000,
        status: 'active',
        createdBy: 'user-franchise-local'
      },
      cards: [
        {
          id: 'wfc-001',
          cardNo: 'WFC-batch-request-001-0001',
          bindCode: 'BIND-batch-request-001-0001',
          issuerFranchiseId: 'franchise-local-review',
          faceValueAmount: 5000,
          status: 'unbound'
        }
      ]
    });

    const response = await request(app.getHttpServer())
      .post('/api/franchises/franchise-local-review/welfare-card-batches')
      .set('Authorization', `Bearer ${token}`)
      .send({
        requestId: 'batch-request-001',
        batchName: '端午福利卡批次',
        faceValueAmount: 5000,
        totalCards: 2,
        remark: '实体卡批次'
      })
      .expect(201);

    expect(welfareCardService.createWelfareCardBatch).toHaveBeenCalledWith({
      franchiseId: 'franchise-local-review',
      requestId: 'batch-request-001',
      batchName: '端午福利卡批次',
      faceValueAmount: 5000,
      totalCards: 2,
      createdBy: 'user-franchise-local',
      remark: '实体卡批次'
    });
    expect(response.body.batch.issuerFranchiseId).toBe('franchise-local-review');
    expect(response.body.cards[0].status).toBe('unbound');
  });

  it('prevents a franchise user from creating welfare-card batches for another franchise', async () => {
    const token = await loginAndGetToken(app, 'franchise-local');

    await request(app.getHttpServer())
      .post('/api/franchises/franchise-other/welfare-card-batches')
      .set('Authorization', `Bearer ${token}`)
      .send({
        requestId: 'batch-request-001',
        batchName: '端午福利卡批次',
        faceValueAmount: 5000,
        totalCards: 2
      })
      .expect(403);

    expect(welfareCardService.createWelfareCardBatch).not.toHaveBeenCalled();
  });

  it('binds an entity welfare card into the authenticated buyer account and ignores body buyer IDs', async () => {
    const token = await loginAndGetToken(app, 'buyer-local');
    welfareCardService.bindWelfareCard.mockResolvedValue({
      idempotentReplay: false,
      card: {
        id: 'wfc-001',
        cardNo: 'WFC-batch-request-001-0001',
        issuerFranchiseId: 'franchise-local-review',
        status: 'bound',
        boundBuyerUserId: 'user-001',
        boundAccountId: 'wca-001'
      },
      account: {
        id: 'wca-001',
        accountNo: 'WCA-franchise-local-review-user-001',
        franchiseId: 'franchise-local-review',
        buyerUserId: 'user-001',
        status: 'active',
        balanceAmount: 5000,
        issuedAmount: 5000
      },
      ledgerEntry: {
        id: 'wcl-bind-001',
        ledgerNo: 'WCL-bind-request-001',
        requestId: 'bind-request-001',
        accountId: 'wca-001',
        franchiseId: 'franchise-local-review',
        buyerUserId: 'user-001',
        type: 'bind',
        amount: 5000,
        balanceAfter: 5000
      }
    });

    const response = await request(app.getHttpServer())
      .post('/api/franchises/franchise-local-review/welfare-cards/bind')
      .set('Authorization', `Bearer ${token}`)
      .send({
        requestId: 'bind-request-001',
        cardNo: 'WFC-batch-request-001-0001',
        bindCode: 'BIND-batch-request-001-0001',
        buyerUserId: 'attacker-user'
      })
      .expect(201);

    expect(welfareCardService.bindWelfareCard).toHaveBeenCalledWith({
      franchiseId: 'franchise-local-review',
      buyerUserId: 'user-001',
      requestId: 'bind-request-001',
      cardNo: 'WFC-batch-request-001-0001',
      bindCode: 'BIND-batch-request-001-0001'
    });
    expect(response.body.account.buyerUserId).toBe('user-001');
    expect(response.body.ledgerEntry.type).toBe('bind');
  });

  it('rejects non-buyer users on the user welfare-card binding endpoint', async () => {
    const token = await loginAndGetToken(app, 'franchise-local');

    await request(app.getHttpServer())
      .post('/api/franchises/franchise-local-review/welfare-cards/bind')
      .set('Authorization', `Bearer ${token}`)
      .send({
        requestId: 'bind-request-001',
        cardNo: 'WFC-batch-request-001-0001',
        bindCode: 'BIND-batch-request-001-0001'
      })
      .expect(403);

    expect(welfareCardService.bindWelfareCard).not.toHaveBeenCalled();
  });

  it('lists welfare-card accounts for the authenticated buyer under one sales franchise', async () => {
    const token = await loginAndGetToken(app, 'buyer-local');
    welfareCardService.listBuyerWelfareCardAccounts.mockResolvedValue({
      accounts: [
        {
          id: 'wca-001',
          accountNo: 'WCA-franchise-local-review-user-001',
          franchiseId: 'franchise-local-review',
          buyerUserId: 'user-001',
          status: 'active',
          balanceAmount: 5000,
          issuedAmount: 5000
        }
      ]
    });

    const response = await request(app.getHttpServer())
      .get('/api/franchises/franchise-local-review/welfare-card-accounts/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(welfareCardService.listBuyerWelfareCardAccounts).toHaveBeenCalledWith({
      franchiseId: 'franchise-local-review',
      buyerUserId: 'user-001'
    });
    expect(response.body.accounts).toEqual([
      expect.objectContaining({
        id: 'wca-001',
        franchiseId: 'franchise-local-review',
        buyerUserId: 'user-001',
        balanceAmount: 5000
      })
    ]);
  });

  it('rejects non-buyer users on the buyer welfare-card account list endpoint', async () => {
    const token = await loginAndGetToken(app, 'franchise-local');

    await request(app.getHttpServer())
      .get('/api/franchises/franchise-local-review/welfare-card-accounts/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    expect(welfareCardService.listBuyerWelfareCardAccounts).not.toHaveBeenCalled();
  });
});

async function loginAndGetToken(app: INestApplication, username: string) {
  const response = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ username, password: 'local-dev-password' })
    .expect(201);

  return response.body.accessToken as string;
}
