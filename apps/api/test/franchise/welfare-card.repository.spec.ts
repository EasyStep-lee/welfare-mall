import {
  WelfareCardBatchStatuses,
  WelfareCardLedgerEntryTypes,
  WelfareCardStatuses
} from '../../src/franchise/welfare-card-status';
import { WelfareCardRepository } from '../../src/franchise/welfare-card.repository';

const accountRecord = {
  id: 'wca-001',
  accountNo: 'WCA-franchise-local-review-buyer-local',
  franchiseId: 'franchise-local-review',
  buyerUserId: 'buyer-local',
  status: 'active',
  balanceAmount: 0,
  issuedAmount: 0,
  createdAt: new Date('2026-06-08T00:00:00.000Z'),
  updatedAt: new Date('2026-06-08T00:00:00.000Z')
};

const creditedAccountRecord = {
  ...accountRecord,
  balanceAmount: 20000,
  issuedAmount: 20000,
  updatedAt: new Date('2026-06-08T00:01:00.000Z')
};

const ledgerRecord = {
  id: 'wcl-001',
  ledgerNo: 'WCL-issue-local-001',
  requestId: 'issue-local-001',
  accountId: accountRecord.id,
  franchiseId: accountRecord.franchiseId,
  buyerUserId: accountRecord.buyerUserId,
  type: WelfareCardLedgerEntryTypes.Issue,
  amount: 20000,
  balanceAfter: 20000,
  orderNo: null,
  remark: '本地福利卡发行',
  createdAt: new Date('2026-06-08T00:01:00.000Z')
};

const batchRecord = {
  id: 'wcb-001',
  batchNo: 'WCB-batch-request-001',
  requestId: 'batch-request-001',
  issuerFranchiseId: 'franchise-local-review',
  batchName: '端午福利卡批次',
  faceValueAmount: 5000,
  totalCards: 2,
  totalAmount: 10000,
  status: WelfareCardBatchStatuses.Active,
  createdBy: 'franchise-user-local',
  remark: '实体卡批次',
  createdAt: new Date('2026-06-12T00:00:00.000Z'),
  updatedAt: new Date('2026-06-12T00:00:00.000Z')
};

const cardRecords = [
  {
    id: 'wfc-001',
    cardNo: 'WFC-batch-request-001-0001',
    bindCode: 'BIND-batch-request-001-0001',
    batchId: batchRecord.id,
    issuerFranchiseId: batchRecord.issuerFranchiseId,
    faceValueAmount: batchRecord.faceValueAmount,
    status: WelfareCardStatuses.Unbound,
    boundBuyerUserId: null,
    boundAccountId: null,
    boundAt: null,
    createdAt: new Date('2026-06-12T00:00:00.000Z'),
    updatedAt: new Date('2026-06-12T00:00:00.000Z')
  },
  {
    id: 'wfc-002',
    cardNo: 'WFC-batch-request-001-0002',
    bindCode: 'BIND-batch-request-001-0002',
    batchId: batchRecord.id,
    issuerFranchiseId: batchRecord.issuerFranchiseId,
    faceValueAmount: batchRecord.faceValueAmount,
    status: WelfareCardStatuses.Unbound,
    boundBuyerUserId: null,
    boundAccountId: null,
    boundAt: null,
    createdAt: new Date('2026-06-12T00:00:00.000Z'),
    updatedAt: new Date('2026-06-12T00:00:00.000Z')
  }
];

const boundCardRecord = {
  ...cardRecords[0],
  status: WelfareCardStatuses.Bound,
  boundBuyerUserId: accountRecord.buyerUserId,
  boundAccountId: accountRecord.id,
  boundAt: new Date('2026-06-12T00:10:00.000Z')
};

const bindLedgerRecord = {
  ...ledgerRecord,
  id: 'wcl-bind-001',
  ledgerNo: 'WCL-bind-request-001',
  requestId: 'bind-request-001',
  type: WelfareCardLedgerEntryTypes.Bind,
  amount: 5000,
  balanceAfter: 5000,
  remark: '实体卡绑定'
};

function createPrismaMock() {
  const tx = {
    welfareCardLedgerEntry: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(ledgerRecord)
    },
    welfareCardBatch: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(batchRecord)
    },
    welfareCard: {
      createMany: jest.fn().mockResolvedValue({ count: 2 }),
      findMany: jest.fn().mockResolvedValue(cardRecords),
      findFirst: jest.fn().mockResolvedValue(cardRecords[0]),
      update: jest.fn().mockResolvedValue(boundCardRecord)
    },
    welfareCardAccount: {
      upsert: jest.fn().mockResolvedValue(accountRecord),
      update: jest.fn().mockResolvedValue(creditedAccountRecord)
    }
  };

  return {
    $transaction: jest.fn(async (callback: (client: typeof tx) => unknown) => callback(tx)),
    tx
  };
}

describe('WelfareCardRepository', () => {
  it('issues a franchise welfare-card account with a credit ledger entry', async () => {
    const prisma = createPrismaMock();
    const repository = new WelfareCardRepository(prisma as never);

    const result = await repository.issueWelfareCard({
      franchiseId: 'franchise-local-review',
      buyerUserId: 'buyer-local',
      requestId: 'issue-local-001',
      amount: 20000,
      remark: '本地福利卡发行'
    });

    expect(prisma.tx.welfareCardAccount.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          franchiseId_buyerUserId: {
            franchiseId: 'franchise-local-review',
            buyerUserId: 'buyer-local'
          }
        },
        create: expect.objectContaining({
          franchiseId: 'franchise-local-review',
          buyerUserId: 'buyer-local',
          balanceAmount: 0,
          issuedAmount: 0,
          status: 'active'
        })
      })
    );
    expect(prisma.tx.welfareCardAccount.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: accountRecord.id },
        data: {
          balanceAmount: { increment: 20000 },
          issuedAmount: { increment: 20000 }
        }
      })
    );
    expect(prisma.tx.welfareCardLedgerEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          requestId: 'issue-local-001',
          accountId: accountRecord.id,
          franchiseId: 'franchise-local-review',
          buyerUserId: 'buyer-local',
          type: WelfareCardLedgerEntryTypes.Issue,
          amount: 20000,
          balanceAfter: 20000,
          remark: '本地福利卡发行'
        })
      })
    );
    expect(result).toEqual({
      idempotentReplay: false,
      account: creditedAccountRecord,
      ledgerEntry: ledgerRecord
    });
  });

  it('returns an existing ledger for duplicate issue request without incrementing balance again', async () => {
    const prisma = createPrismaMock();
    prisma.tx.welfareCardLedgerEntry.findUnique.mockResolvedValue({
      ...ledgerRecord,
      account: creditedAccountRecord
    });
    const repository = new WelfareCardRepository(prisma as never);

    const result = await repository.issueWelfareCard({
      franchiseId: 'franchise-local-review',
      buyerUserId: 'buyer-local',
      requestId: 'issue-local-001',
      amount: 20000
    });

    expect(prisma.tx.welfareCardAccount.upsert).not.toHaveBeenCalled();
    expect(prisma.tx.welfareCardAccount.update).not.toHaveBeenCalled();
    expect(prisma.tx.welfareCardLedgerEntry.create).not.toHaveBeenCalled();
    expect(result).toEqual({
      idempotentReplay: true,
      account: creditedAccountRecord,
      ledgerEntry: ledgerRecord
    });
  });

  it('creates a franchise welfare-card batch and generated unbound entity cards', async () => {
    const prisma = createPrismaMock();
    const repository = new WelfareCardRepository(prisma as never);

    const result = await repository.createWelfareCardBatch({
      franchiseId: 'franchise-local-review',
      requestId: 'batch-request-001',
      batchName: '端午福利卡批次',
      faceValueAmount: 5000,
      totalCards: 2,
      createdBy: 'franchise-user-local',
      remark: '实体卡批次'
    });

    expect(prisma.tx.welfareCardBatch.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          requestId: 'batch-request-001',
          issuerFranchiseId: 'franchise-local-review',
          batchName: '端午福利卡批次',
          faceValueAmount: 5000,
          totalCards: 2,
          totalAmount: 10000,
          status: WelfareCardBatchStatuses.Active,
          createdBy: 'franchise-user-local'
        })
      })
    );
    expect(prisma.tx.welfareCard.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          cardNo: 'WFC-batch-request-001-0001',
          bindCode: 'BIND-batch-request-001-0001',
          issuerFranchiseId: 'franchise-local-review',
          faceValueAmount: 5000,
          status: WelfareCardStatuses.Unbound
        }),
        expect.objectContaining({
          cardNo: 'WFC-batch-request-001-0002',
          bindCode: 'BIND-batch-request-001-0002',
          issuerFranchiseId: 'franchise-local-review',
          faceValueAmount: 5000,
          status: WelfareCardStatuses.Unbound
        })
      ]
    });
    expect(result).toEqual({
      idempotentReplay: false,
      batch: batchRecord,
      cards: cardRecords
    });
  });

  it('binds an unbound entity card into a buyer welfare-card account with a bind ledger entry', async () => {
    const prisma = createPrismaMock();
    prisma.tx.welfareCardAccount.update.mockResolvedValue({
      ...accountRecord,
      balanceAmount: 5000,
      issuedAmount: 5000
    });
    prisma.tx.welfareCardLedgerEntry.create.mockResolvedValue(bindLedgerRecord);
    const repository = new WelfareCardRepository(prisma as never);

    const result = await repository.bindWelfareCard({
      franchiseId: 'franchise-local-review',
      buyerUserId: 'buyer-local',
      requestId: 'bind-request-001',
      cardNo: 'WFC-batch-request-001-0001',
      bindCode: 'BIND-batch-request-001-0001'
    });

    expect(prisma.tx.welfareCard.findFirst).toHaveBeenCalledWith({
      where: {
        cardNo: 'WFC-batch-request-001-0001',
        bindCode: 'BIND-batch-request-001-0001',
        issuerFranchiseId: 'franchise-local-review'
      },
      select: expect.any(Object)
    });
    expect(prisma.tx.welfareCardAccount.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          franchiseId_buyerUserId: {
            franchiseId: 'franchise-local-review',
            buyerUserId: 'buyer-local'
          }
        }
      })
    );
    expect(prisma.tx.welfareCard.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'wfc-001' },
        data: expect.objectContaining({
          status: WelfareCardStatuses.Bound,
          boundBuyerUserId: 'buyer-local',
          boundAccountId: 'wca-001'
        })
      })
    );
    expect(prisma.tx.welfareCardLedgerEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          requestId: 'bind-request-001',
          accountId: 'wca-001',
          franchiseId: 'franchise-local-review',
          buyerUserId: 'buyer-local',
          type: WelfareCardLedgerEntryTypes.Bind,
          amount: 5000,
          balanceAfter: 5000
        })
      })
    );
    expect(result).toEqual({
      idempotentReplay: false,
      card: boundCardRecord,
      account: expect.objectContaining({ balanceAmount: 5000, issuedAmount: 5000 }),
      ledgerEntry: bindLedgerRecord
    });
  });
});
