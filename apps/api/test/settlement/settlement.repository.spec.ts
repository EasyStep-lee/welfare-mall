import { SettlementRepository } from '../../src/settlement/settlement.repository';

const paidOrder = {
  orderNo: 'ORDER-20260605-001',
  status: 'paid',
  lines: [
    {
      id: 'order-line-001',
      productId: 'product-001',
      skuId: 'sku-001',
      lineTotalAmount: 13980
    },
    {
      id: 'order-line-002',
      productId: 'product-002',
      skuId: null,
      lineTotalAmount: 5000
    }
  ]
};

const billItems = [
  {
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
  },
  {
    id: 'bill-item-002',
    billItemNo: 'MSBI-ORDER-20260605-001-ORDER-LINE-002',
    merchantId: 'merchant-002',
    orderNo: 'ORDER-20260605-001',
    orderLineId: 'order-line-002',
    productId: 'product-002',
    skuId: null,
    source: 'order_paid',
    status: 'pending_settlement',
    grossAmount: 5000,
    refundOffsetAmount: 0,
    adjustmentAmount: 0,
    netAmount: 5000,
    createdAt: new Date('2026-06-05T00:00:00.000Z'),
    updatedAt: new Date('2026-06-05T00:00:00.000Z')
  }
];

function createPrismaMock() {
  return {
    orderHeader: {
      findUnique: jest.fn().mockResolvedValue(paidOrder)
    },
    product: {
      findMany: jest.fn().mockResolvedValue([
        { id: 'product-001', merchantId: 'merchant-001' },
        { id: 'product-002', merchantId: 'merchant-002' }
      ])
    },
    merchantSettlementBillItem: {
      createMany: jest.fn().mockResolvedValue({ count: 2 }),
      update: jest.fn(),
      findMany: jest.fn().mockResolvedValue(billItems)
    }
  };
}

describe('SettlementRepository', () => {
  it('generates merchant bill items from one paid order snapshot', async () => {
    const prisma = createPrismaMock();
    const repository = new SettlementRepository(prisma as never);

    const result = await repository.generateMerchantBillItemsForPaidOrder('ORDER-20260605-001');

    expect(prisma.orderHeader.findUnique).toHaveBeenCalledWith({
      where: { orderNo: 'ORDER-20260605-001' },
      select: expect.any(Object)
    });
    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: { id: { in: ['product-001', 'product-002'] } },
      select: { id: true, merchantId: true }
    });
    expect(prisma.merchantSettlementBillItem.createMany).toHaveBeenCalledWith({
      data: [
        {
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
          netAmount: 13980
        },
        {
          billItemNo: 'MSBI-ORDER-20260605-001-ORDER-LINE-002',
          merchantId: 'merchant-002',
          orderNo: 'ORDER-20260605-001',
          orderLineId: 'order-line-002',
          productId: 'product-002',
          skuId: null,
          source: 'order_paid',
          status: 'pending_settlement',
          grossAmount: 5000,
          refundOffsetAmount: 0,
          adjustmentAmount: 0,
          netAmount: 5000
        }
      ],
      skipDuplicates: true
    });
    expect(result.items).toEqual(billItems);
  });

  it('returns no generated items for missing or non-paid orders', async () => {
    const prisma = createPrismaMock();
    prisma.orderHeader.findUnique.mockResolvedValue({ ...paidOrder, status: 'pending_payment' });
    const repository = new SettlementRepository(prisma as never);

    const result = await repository.generateMerchantBillItemsForPaidOrder('ORDER-20260605-001');

    expect(prisma.product.findMany).not.toHaveBeenCalled();
    expect(prisma.merchantSettlementBillItem.createMany).not.toHaveBeenCalled();
    expect(result.items).toEqual([]);
  });

  it('lists merchant bill items by merchant and status', async () => {
    const prisma = createPrismaMock();
    const repository = new SettlementRepository(prisma as never);

    const result = await repository.listMerchantBillItems({
      merchantId: 'merchant-001',
      status: 'pending_settlement'
    });

    expect(prisma.merchantSettlementBillItem.findMany).toHaveBeenCalledWith({
      where: {
        merchantId: 'merchant-001',
        status: 'pending_settlement'
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: expect.any(Object)
    });
    expect(result.items).toEqual(billItems);
  });

  it('allocates a successful refund across pending merchant bill items', async () => {
    const prisma = createPrismaMock();
    const updatedItems = [
      {
        ...billItems[0],
        status: 'reversed',
        refundOffsetAmount: 13980,
        netAmount: 0
      },
      {
        ...billItems[1],
        refundOffsetAmount: 1020,
        netAmount: 3980
      }
    ];
    prisma.merchantSettlementBillItem.findMany.mockResolvedValue(billItems);
    prisma.merchantSettlementBillItem.update
      .mockResolvedValueOnce(updatedItems[0])
      .mockResolvedValueOnce(updatedItems[1]);
    const repository = new SettlementRepository(prisma as never);

    const result = await repository.applyRefundOffsetForSucceededRefund({
      orderNo: 'ORDER-20260605-001',
      refundAmount: 15000
    });

    expect(prisma.merchantSettlementBillItem.findMany).toHaveBeenCalledWith({
      where: {
        orderNo: 'ORDER-20260605-001',
        status: 'pending_settlement'
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      select: expect.any(Object)
    });
    expect(prisma.merchantSettlementBillItem.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'bill-item-001' },
      data: {
        refundOffsetAmount: { increment: 13980 },
        netAmount: { decrement: 13980 },
        status: 'reversed'
      },
      select: expect.any(Object)
    });
    expect(prisma.merchantSettlementBillItem.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'bill-item-002' },
      data: {
        refundOffsetAmount: { increment: 1020 },
        netAmount: { decrement: 1020 },
        status: 'pending_settlement'
      },
      select: expect.any(Object)
    });
    expect(result.items).toEqual(updatedItems);
  });

  it('does not offset bill items when no pending settlement amount remains', async () => {
    const prisma = createPrismaMock();
    prisma.merchantSettlementBillItem.findMany.mockResolvedValue([
      {
        ...billItems[0],
        status: 'reversed',
        refundOffsetAmount: 13980,
        netAmount: 0
      }
    ]);
    const repository = new SettlementRepository(prisma as never);

    const result = await repository.applyRefundOffsetForSucceededRefund({
      orderNo: 'ORDER-20260605-001',
      refundAmount: 5000
    });

    expect(prisma.merchantSettlementBillItem.update).not.toHaveBeenCalled();
    expect(result.items).toEqual([]);
  });
});
