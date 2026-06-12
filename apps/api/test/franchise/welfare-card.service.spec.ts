import { BadRequestException } from '@nestjs/common';
import { WelfareCardService } from '../../src/franchise/welfare-card.service';

function createRepositoryMock() {
  return {
    issueWelfareCard: jest.fn().mockResolvedValue({
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
    }),
    createWelfareCardBatch: jest.fn().mockResolvedValue({
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
        createdBy: 'franchise-user-local'
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
    }),
    bindWelfareCard: jest.fn().mockResolvedValue({
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
    })
  };
}

describe('WelfareCardService', () => {
  it('normalizes and delegates a franchise welfare-card issue request', async () => {
    const repository = createRepositoryMock();
    const service = new WelfareCardService(repository as never);

    await service.issueWelfareCard({
      franchiseId: ' franchise-local-review ',
      buyerUserId: ' buyer-local ',
      requestId: ' issue-local-001 ',
      amount: 20000,
      remark: ' 本地福利卡发行 '
    });

    expect(repository.issueWelfareCard).toHaveBeenCalledWith({
      franchiseId: 'franchise-local-review',
      buyerUserId: 'buyer-local',
      requestId: 'issue-local-001',
      amount: 20000,
      remark: '本地福利卡发行'
    });
  });

  it('rejects a non-positive issue amount before writing account ledger', async () => {
    const repository = createRepositoryMock();
    const service = new WelfareCardService(repository as never);

    await expect(
      service.issueWelfareCard({
        franchiseId: 'franchise-local-review',
        buyerUserId: 'buyer-local',
        requestId: 'issue-local-001',
        amount: 0
      })
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.issueWelfareCard).not.toHaveBeenCalled();
  });

  it('rejects blank business identifiers before writing account ledger', async () => {
    const repository = createRepositoryMock();
    const service = new WelfareCardService(repository as never);

    await expect(
      service.issueWelfareCard({
        franchiseId: ' ',
        buyerUserId: 'buyer-local',
        requestId: 'issue-local-001',
        amount: 1000
      })
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.issueWelfareCard({
        franchiseId: 'franchise-local-review',
        buyerUserId: ' ',
        requestId: 'issue-local-001',
        amount: 1000
      })
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.issueWelfareCard({
        franchiseId: 'franchise-local-review',
        buyerUserId: 'buyer-local',
        requestId: ' ',
        amount: 1000
      })
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.issueWelfareCard).not.toHaveBeenCalled();
  });

  it('normalizes and delegates a welfare-card batch creation request', async () => {
    const repository = createRepositoryMock();
    const service = new WelfareCardService(repository as never);

    await service.createWelfareCardBatch({
      franchiseId: ' franchise-local-review ',
      requestId: ' batch-request-001 ',
      batchName: ' 端午福利卡批次 ',
      faceValueAmount: 5000,
      totalCards: 2,
      createdBy: ' franchise-user-local ',
      remark: ' 实体卡批次 '
    });

    expect(repository.createWelfareCardBatch).toHaveBeenCalledWith({
      franchiseId: 'franchise-local-review',
      requestId: 'batch-request-001',
      batchName: '端午福利卡批次',
      faceValueAmount: 5000,
      totalCards: 2,
      createdBy: 'franchise-user-local',
      remark: '实体卡批次'
    });
  });

  it('rejects invalid welfare-card batch values before writing cards', async () => {
    const repository = createRepositoryMock();
    const service = new WelfareCardService(repository as never);

    await expect(
      service.createWelfareCardBatch({
        franchiseId: 'franchise-local-review',
        requestId: 'batch-request-001',
        batchName: '端午福利卡批次',
        faceValueAmount: 0,
        totalCards: 2,
        createdBy: 'franchise-user-local'
      })
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.createWelfareCardBatch({
        franchiseId: 'franchise-local-review',
        requestId: 'batch-request-001',
        batchName: '端午福利卡批次',
        faceValueAmount: 5000,
        totalCards: 0,
        createdBy: 'franchise-user-local'
      })
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.createWelfareCardBatch).not.toHaveBeenCalled();
  });

  it('normalizes and delegates a buyer welfare-card binding request', async () => {
    const repository = createRepositoryMock();
    const service = new WelfareCardService(repository as never);

    await service.bindWelfareCard({
      franchiseId: ' franchise-local-review ',
      buyerUserId: ' user-001 ',
      requestId: ' bind-request-001 ',
      cardNo: ' WFC-batch-request-001-0001 ',
      bindCode: ' BIND-batch-request-001-0001 '
    });

    expect(repository.bindWelfareCard).toHaveBeenCalledWith({
      franchiseId: 'franchise-local-review',
      buyerUserId: 'user-001',
      requestId: 'bind-request-001',
      cardNo: 'WFC-batch-request-001-0001',
      bindCode: 'BIND-batch-request-001-0001'
    });
  });

  it('rejects blank welfare-card binding fields before writing account ledger', async () => {
    const repository = createRepositoryMock();
    const service = new WelfareCardService(repository as never);

    await expect(
      service.bindWelfareCard({
        franchiseId: 'franchise-local-review',
        buyerUserId: 'user-001',
        requestId: ' ',
        cardNo: 'WFC-batch-request-001-0001',
        bindCode: 'BIND-batch-request-001-0001'
      })
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.bindWelfareCard({
        franchiseId: 'franchise-local-review',
        buyerUserId: 'user-001',
        requestId: 'bind-request-001',
        cardNo: ' ',
        bindCode: 'BIND-batch-request-001-0001'
      })
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.bindWelfareCard({
        franchiseId: 'franchise-local-review',
        buyerUserId: 'user-001',
        requestId: 'bind-request-001',
        cardNo: 'WFC-batch-request-001-0001',
        bindCode: ' '
      })
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.bindWelfareCard).not.toHaveBeenCalled();
  });
});
