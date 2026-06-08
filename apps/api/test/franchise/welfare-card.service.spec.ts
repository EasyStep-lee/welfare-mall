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
});
