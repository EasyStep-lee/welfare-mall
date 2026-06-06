import { BadRequestException } from '@nestjs/common';
import { SettlementRepository } from '../../src/settlement/settlement.repository';
import { SettlementService } from '../../src/settlement/settlement.service';

const billItem = {
  id: 'bill-item-001',
  billItemNo: 'MSBI-ORDER-20260605-001-ORDER-LINE-001',
  merchantId: 'merchant-001',
  orderNo: 'ORDER-20260605-001',
  orderLineId: 'order-line-001',
  productId: 'product-001',
  skuId: 'sku-001',
  source: 'order_paid',
  status: 'pending_settlement',
  grossAmount: 13980,
  refundOffsetAmount: 0,
  adjustmentAmount: 0,
  netAmount: 13980,
  createdAt: new Date('2026-06-05T00:00:00.000Z'),
  updatedAt: new Date('2026-06-05T00:00:00.000Z')
};

const statement = {
  id: 'statement-001',
  statementNo: 'MSS-20260606-001',
  merchantId: 'merchant-001',
  status: 'generated',
  itemCount: 1,
  grossAmount: 13980,
  refundOffsetAmount: 0,
  adjustmentAmount: 0,
  netAmount: 13980,
  generatedAt: new Date('2026-06-06T00:00:00.000Z'),
  paidAt: null,
  createdAt: new Date('2026-06-06T00:00:00.000Z'),
  updatedAt: new Date('2026-06-06T00:00:00.000Z'),
  items: [billItem]
};

function createRepositoryMock() {
  return {
    generateMerchantBillItemsForPaidOrder: jest.fn().mockResolvedValue({ items: [billItem] }),
    listMerchantBillItems: jest.fn().mockResolvedValue({ items: [billItem] }),
    generateMerchantSettlementStatement: jest.fn().mockResolvedValue({ statement }),
    listMerchantSettlementStatements: jest.fn().mockResolvedValue({ statements: [statement] })
  };
}

describe('SettlementService', () => {
  it('normalizes order number before generating merchant bill items', async () => {
    const repository = createRepositoryMock();
    const service = new SettlementService(repository as unknown as SettlementRepository);

    const result = await service.generateMerchantBillItems({ orderNo: ' ORDER-20260605-001 ' });

    expect(repository.generateMerchantBillItemsForPaidOrder).toHaveBeenCalledWith('ORDER-20260605-001');
    expect(result.items).toEqual([billItem]);
  });

  it('rejects blank order number before generation', async () => {
    const repository = createRepositoryMock();
    const service = new SettlementService(repository as unknown as SettlementRepository);

    await expect(service.generateMerchantBillItems({ orderNo: ' ' })).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.generateMerchantBillItemsForPaidOrder).not.toHaveBeenCalled();
  });

  it('normalizes list filters before delegating to repository', async () => {
    const repository = createRepositoryMock();
    const service = new SettlementService(repository as unknown as SettlementRepository);

    await service.listMerchantBillItems({
      merchantId: ' merchant-001 ',
      status: ' pending_settlement '
    });

    expect(repository.listMerchantBillItems).toHaveBeenCalledWith({
      merchantId: 'merchant-001',
      status: 'pending_settlement'
    });
  });

  it('normalizes merchant ID before generating a settlement statement', async () => {
    const repository = createRepositoryMock();
    const service = new SettlementService(repository as unknown as SettlementRepository);

    const result = await service.generateMerchantSettlementStatement({ merchantId: ' merchant-001 ' });

    expect(repository.generateMerchantSettlementStatement).toHaveBeenCalledWith({
      merchantId: 'merchant-001',
      statementNo: expect.stringMatching(/^MSS-\d{17}-[A-Z0-9]{6}$/),
      generatedAt: expect.any(Date)
    });
    expect(result.statement).toEqual(statement);
  });

  it('rejects blank merchant ID before generating a settlement statement', async () => {
    const repository = createRepositoryMock();
    const service = new SettlementService(repository as unknown as SettlementRepository);

    await expect(service.generateMerchantSettlementStatement({ merchantId: ' ' })).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.generateMerchantSettlementStatement).not.toHaveBeenCalled();
  });

  it('normalizes statement list filters before delegating to repository', async () => {
    const repository = createRepositoryMock();
    const service = new SettlementService(repository as unknown as SettlementRepository);

    await service.listMerchantSettlementStatements({
      merchantId: ' merchant-001 ',
      status: ' generated '
    });

    expect(repository.listMerchantSettlementStatements).toHaveBeenCalledWith({
      merchantId: 'merchant-001',
      status: 'generated'
    });
  });
});
