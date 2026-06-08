import { WelfareCardLedgerEntryTypes } from '../../src/franchise/welfare-card-status';
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

function createPrismaMock() {
  const tx = {
    welfareCardLedgerEntry: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(ledgerRecord)
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
});
