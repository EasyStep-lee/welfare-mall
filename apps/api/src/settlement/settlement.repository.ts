import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  FranchiseSalesLedgerSources,
  FranchiseSalesLedgerStatuses,
  MerchantSettlementBillSources,
  MerchantSettlementBillStatuses,
  MerchantSettlementStatementStatuses
} from './settlement-status';

export type MerchantSettlementBillItemRecord = {
  id: string;
  billItemNo: string;
  merchantId: string;
  orderNo: string;
  orderLineId: string;
  productId: string;
  skuId: string | null;
  source: string;
  status: string;
  grossAmount: number;
  refundOffsetAmount: number;
  adjustmentAmount: number;
  netAmount: number;
  statementId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type MerchantSettlementStatementRecord = {
  id: string;
  statementNo: string;
  merchantId: string;
  status: string;
  itemCount: number;
  grossAmount: number;
  refundOffsetAmount: number;
  adjustmentAmount: number;
  netAmount: number;
  generatedAt: Date;
  paidAt: Date | null;
  payoutReference: string | null;
  payoutRemark: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: MerchantSettlementBillItemRecord[];
};

export type FranchiseSalesLedgerEntryRecord = {
  id: string;
  entryNo: string;
  franchiseId: string;
  orderNo: string;
  paymentNo: string | null;
  refundNo: string | null;
  buyerUserId: string;
  source: string;
  status: string;
  totalAmount: number;
  welfareCardAmount: number;
  onlineCashAmount: number;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type MerchantSettlementBillItemListInput = {
  merchantId?: string;
  status?: string;
};

export type ApplyRefundOffsetInput = {
  orderNo: string;
  refundAmount: number;
};

export type GenerateFranchiseRefundSalesLedgerInput = {
  orderNo: string;
  paymentNo: string;
  refundNo: string;
  refundAmount: number;
};

export type GenerateMerchantSettlementStatementInput = {
  merchantId: string;
  statementNo: string;
  generatedAt: Date;
};

export type ConfirmMerchantSettlementStatementOfflinePayoutInput = {
  statementNo: string;
  paidAt: Date;
  payoutReference?: string | null;
  payoutRemark?: string | null;
};

export type MerchantSettlementStatementListInput = {
  merchantId?: string;
  status?: string;
};

export type MerchantSettlementBillItemListResult = {
  items: MerchantSettlementBillItemRecord[];
};

export type FranchiseSalesLedgerEntryListResult = {
  entries: FranchiseSalesLedgerEntryRecord[];
};

export type MerchantSettlementStatementGenerateResult = {
  statement: MerchantSettlementStatementRecord | null;
};

export type MerchantSettlementStatementConfirmResult = {
  statement: MerchantSettlementStatementRecord | null;
};

export type MerchantSettlementStatementListResult = {
  statements: MerchantSettlementStatementRecord[];
};

type PaidOrderForSettlement = {
  orderNo: string;
  status: string;
  lines: Array<{
    id: string;
    productId: string;
    skuId: string | null;
    lineTotalAmount: number;
  }>;
};

type PaidOrderForFranchiseSalesLedger = {
  orderNo: string;
  buyerUserId: string;
  salesFranchiseId: string | null;
  status: string;
  totalAmount: number;
  welfareCardPayableAmount: number;
  cashPayableAmount: number;
};

type PaidPaymentForFranchiseSalesLedger = {
  paymentNo: string;
  orderNo: string;
  status: string;
  channel: string;
  totalAmount: number;
  welfareCardPayableAmount: number;
  cashPayableAmount: number;
  paidAt: Date | null;
};

@Injectable()
export class SettlementRepository {
  constructor(private readonly prisma: PrismaService) {}

  async generateMerchantBillItemsForPaidOrder(orderNo: string): Promise<MerchantSettlementBillItemListResult> {
    const order = await this.prisma.orderHeader.findUnique({
      where: { orderNo },
      select: paidOrderForSettlementSelect()
    });

    if (!order || order.status !== 'paid' || order.lines.length === 0) {
      return { items: [] };
    }

    const billItems = await this.buildBillItems(order);
    if (billItems.length === 0) {
      return { items: [] };
    }

    await this.prisma.merchantSettlementBillItem.createMany({
      data: billItems,
      skipDuplicates: true
    });

    const items = await this.prisma.merchantSettlementBillItem.findMany({
      where: { orderNo },
      orderBy: { createdAt: 'desc' },
      select: merchantSettlementBillItemSelect()
    });

    return { items };
  }

  async generateFranchiseSalesLedgerForPaidOrder(orderNo: string): Promise<FranchiseSalesLedgerEntryListResult> {
    const order = (await this.prisma.orderHeader.findUnique({
      where: { orderNo },
      select: paidOrderForFranchiseSalesLedgerSelect()
    })) as PaidOrderForFranchiseSalesLedger | null;

    if (!order || order.status !== 'paid' || !order.salesFranchiseId) {
      return { entries: [] };
    }

    const payment = (await this.prisma.orderPayment.findFirst({
      where: {
        orderNo,
        status: 'paid'
      },
      orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
      select: paidPaymentForFranchiseSalesLedgerSelect()
    })) as PaidPaymentForFranchiseSalesLedger | null;

    if (!payment) {
      return { entries: [] };
    }

    await this.prisma.franchiseSalesLedgerEntry.createMany({
      data: [
        {
          entryNo: createFranchiseSalesPaidEntryNo(order.orderNo),
          franchiseId: order.salesFranchiseId,
          orderNo: order.orderNo,
          paymentNo: payment.paymentNo,
          refundNo: null,
          buyerUserId: order.buyerUserId,
          source: FranchiseSalesLedgerSources.OrderPaid,
          status: FranchiseSalesLedgerStatuses.Posted,
          totalAmount: payment.totalAmount,
          welfareCardAmount: payment.welfareCardPayableAmount,
          onlineCashAmount: payment.cashPayableAmount,
          amount: payment.totalAmount
        }
      ],
      skipDuplicates: true
    });

    const entries = await this.prisma.franchiseSalesLedgerEntry.findMany({
      where: {
        orderNo,
        source: FranchiseSalesLedgerSources.OrderPaid
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: franchiseSalesLedgerEntrySelect()
    });

    return { entries };
  }

  async listMerchantBillItems(input: MerchantSettlementBillItemListInput = {}): Promise<MerchantSettlementBillItemListResult> {
    const items = await this.prisma.merchantSettlementBillItem.findMany({
      where: merchantBillItemWhere(input),
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: merchantSettlementBillItemSelect()
    });

    return { items };
  }

  async applyRefundOffsetForSucceededRefund(input: ApplyRefundOffsetInput): Promise<MerchantSettlementBillItemListResult> {
    const billItems = await this.prisma.merchantSettlementBillItem.findMany({
      where: {
        orderNo: input.orderNo,
        status: MerchantSettlementBillStatuses.PendingSettlement
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      select: merchantSettlementBillItemSelect()
    });
    let remainingRefundAmount = input.refundAmount;
    const updatedItems: MerchantSettlementBillItemRecord[] = [];

    for (const billItem of billItems) {
      if (remainingRefundAmount <= 0) {
        break;
      }

      const offsetAmount = Math.min(remainingRefundAmount, billItem.netAmount);
      if (offsetAmount <= 0) {
        continue;
      }

      remainingRefundAmount -= offsetAmount;
      const nextNetAmount = billItem.netAmount - offsetAmount;
      const updatedItem = await this.prisma.merchantSettlementBillItem.update({
        where: { id: billItem.id },
        data: {
          refundOffsetAmount: { increment: offsetAmount },
          netAmount: { decrement: offsetAmount },
          status:
            nextNetAmount === 0
              ? MerchantSettlementBillStatuses.Reversed
              : MerchantSettlementBillStatuses.PendingSettlement
        },
        select: merchantSettlementBillItemSelect()
      });
      updatedItems.push(updatedItem);
    }

    return { items: updatedItems };
  }

  async generateFranchiseSalesLedgerForSucceededRefund(
    input: GenerateFranchiseRefundSalesLedgerInput
  ): Promise<FranchiseSalesLedgerEntryListResult> {
    const order = await this.prisma.orderHeader.findUnique({
      where: { orderNo: input.orderNo },
      select: {
        orderNo: true,
        buyerUserId: true,
        salesFranchiseId: true
      }
    });

    if (!order?.buyerUserId || !order.salesFranchiseId) {
      return { entries: [] };
    }

    const payment = await this.prisma.orderPayment.findUnique({
      where: { paymentNo: input.paymentNo },
      select: {
        paymentNo: true,
        orderNo: true,
        welfareCardPayableAmount: true,
        cashPayableAmount: true
      }
    });

    if (!payment) {
      return { entries: [] };
    }

    const welfareCardAmount = Math.min(payment.welfareCardPayableAmount, input.refundAmount);
    const onlineCashAmount = Math.max(0, input.refundAmount - welfareCardAmount);

    await this.prisma.franchiseSalesLedgerEntry.createMany({
      data: [
        {
          entryNo: createFranchiseSalesRefundEntryNo(input.refundNo),
          franchiseId: order.salesFranchiseId,
          orderNo: input.orderNo,
          paymentNo: input.paymentNo,
          refundNo: input.refundNo,
          buyerUserId: order.buyerUserId,
          source: FranchiseSalesLedgerSources.RefundSucceeded,
          status: FranchiseSalesLedgerStatuses.Posted,
          totalAmount: input.refundAmount,
          welfareCardAmount,
          onlineCashAmount,
          amount: -input.refundAmount
        }
      ],
      skipDuplicates: true
    });

    const entries = await this.prisma.franchiseSalesLedgerEntry.findMany({
      where: {
        refundNo: input.refundNo,
        source: FranchiseSalesLedgerSources.RefundSucceeded
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: franchiseSalesLedgerEntrySelect()
    });

    return { entries };
  }

  async generateMerchantSettlementStatement(
    input: GenerateMerchantSettlementStatementInput
  ): Promise<MerchantSettlementStatementGenerateResult> {
    return this.prisma.$transaction(async (tx) => {
      const billItems = await tx.merchantSettlementBillItem.findMany({
        where: {
          merchantId: input.merchantId,
          status: MerchantSettlementBillStatuses.PendingSettlement,
          netAmount: { gt: 0 }
        },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        select: merchantSettlementBillItemSelect()
      });

      if (billItems.length === 0) {
        return { statement: null };
      }

      const totals = billItems.reduce(
        (acc, item) => ({
          grossAmount: acc.grossAmount + item.grossAmount,
          refundOffsetAmount: acc.refundOffsetAmount + item.refundOffsetAmount,
          adjustmentAmount: acc.adjustmentAmount + item.adjustmentAmount,
          netAmount: acc.netAmount + item.netAmount
        }),
        {
          grossAmount: 0,
          refundOffsetAmount: 0,
          adjustmentAmount: 0,
          netAmount: 0
        }
      );

      const statement = await tx.merchantSettlementStatement.create({
        data: {
          statementNo: input.statementNo,
          merchantId: input.merchantId,
          status: MerchantSettlementStatementStatuses.Generated,
          itemCount: billItems.length,
          grossAmount: totals.grossAmount,
          refundOffsetAmount: totals.refundOffsetAmount,
          adjustmentAmount: totals.adjustmentAmount,
          netAmount: totals.netAmount,
          generatedAt: input.generatedAt
        },
        select: merchantSettlementStatementSelect()
      });

      await tx.merchantSettlementBillItem.updateMany({
        where: {
          id: { in: billItems.map((item) => item.id) },
          status: MerchantSettlementBillStatuses.PendingSettlement
        },
        data: {
          status: MerchantSettlementBillStatuses.StatementGenerated,
          statementId: statement.id
        }
      });

      const statements = await tx.merchantSettlementStatement.findMany({
        where: { id: statement.id },
        take: 1,
        select: merchantSettlementStatementSelect()
      });

      return { statement: (statements[0] ?? { ...statement, items: [] }) as MerchantSettlementStatementRecord };
    });
  }

  async listMerchantSettlementStatements(
    input: MerchantSettlementStatementListInput = {}
  ): Promise<MerchantSettlementStatementListResult> {
    const statements = await this.prisma.merchantSettlementStatement.findMany({
      where: merchantSettlementStatementWhere(input),
      orderBy: { generatedAt: 'desc' },
      take: 100,
      select: merchantSettlementStatementSelect()
    });

    return { statements: statements as MerchantSettlementStatementRecord[] };
  }

  async confirmMerchantSettlementStatementOfflinePayout(
    input: ConfirmMerchantSettlementStatementOfflinePayoutInput
  ): Promise<MerchantSettlementStatementConfirmResult> {
    return this.prisma.$transaction(async (tx) => {
      const statement = await tx.merchantSettlementStatement.findFirst({
        where: {
          statementNo: input.statementNo,
          status: MerchantSettlementStatementStatuses.Generated
        },
        select: merchantSettlementStatementSelect()
      });

      if (!statement) {
        return { statement: null };
      }

      await tx.merchantSettlementStatement.update({
        where: { id: statement.id },
        data: {
          status: MerchantSettlementStatementStatuses.PaidOffline,
          paidAt: input.paidAt,
          payoutReference: input.payoutReference ?? null,
          payoutRemark: input.payoutRemark ?? null
        },
        select: merchantSettlementStatementSelect()
      });

      await tx.merchantSettlementBillItem.updateMany({
        where: {
          statementId: statement.id,
          status: MerchantSettlementBillStatuses.StatementGenerated
        },
        data: {
          status: MerchantSettlementBillStatuses.PaidOffline
        }
      });

      const statements = await tx.merchantSettlementStatement.findMany({
        where: { id: statement.id },
        take: 1,
        select: merchantSettlementStatementSelect()
      });

      return { statement: (statements[0] ?? null) as MerchantSettlementStatementRecord | null };
    });
  }

  private async buildBillItems(order: PaidOrderForSettlement) {
    const productIds = Array.from(new Set(order.lines.map((line) => line.productId)));
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, merchantId: true }
    });
    const merchantIdByProductId = new Map(products.map((product) => [product.id, product.merchantId]));

    return order.lines.flatMap((line) => {
      const merchantId = merchantIdByProductId.get(line.productId);
      if (!merchantId) {
        return [];
      }

      return [
        {
          billItemNo: createBillItemNo(order.orderNo, line.id),
          merchantId,
          orderNo: order.orderNo,
          orderLineId: line.id,
          productId: line.productId,
          skuId: line.skuId,
          source: MerchantSettlementBillSources.OrderPaid,
          status: MerchantSettlementBillStatuses.PendingSettlement,
          grossAmount: line.lineTotalAmount,
          refundOffsetAmount: 0,
          adjustmentAmount: 0,
          netAmount: line.lineTotalAmount
        }
      ];
    });
  }
}

function paidOrderForSettlementSelect() {
  return {
    orderNo: true,
    status: true,
    lines: {
      select: {
        id: true,
        productId: true,
        skuId: true,
        lineTotalAmount: true
      }
    }
  } as const;
}

function paidOrderForFranchiseSalesLedgerSelect() {
  return {
    orderNo: true,
    buyerUserId: true,
    salesFranchiseId: true,
    status: true,
    totalAmount: true,
    welfareCardPayableAmount: true,
    cashPayableAmount: true
  } as const;
}

function paidPaymentForFranchiseSalesLedgerSelect() {
  return {
    paymentNo: true,
    orderNo: true,
    status: true,
    channel: true,
    totalAmount: true,
    welfareCardPayableAmount: true,
    cashPayableAmount: true,
    paidAt: true
  } as const;
}

function merchantSettlementBillItemSelect() {
  return {
    id: true,
    billItemNo: true,
    merchantId: true,
    orderNo: true,
    orderLineId: true,
    productId: true,
    skuId: true,
    source: true,
    status: true,
    grossAmount: true,
    refundOffsetAmount: true,
    adjustmentAmount: true,
    netAmount: true,
    statementId: true,
    createdAt: true,
    updatedAt: true
  } as const;
}

function merchantSettlementStatementSelect(): Prisma.MerchantSettlementStatementSelect {
  return {
    id: true,
    statementNo: true,
    merchantId: true,
    status: true,
    itemCount: true,
    grossAmount: true,
    refundOffsetAmount: true,
    adjustmentAmount: true,
    netAmount: true,
    generatedAt: true,
    paidAt: true,
    payoutReference: true,
    payoutRemark: true,
    createdAt: true,
    updatedAt: true,
    items: {
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      select: merchantSettlementBillItemSelect()
    }
  };
}

function franchiseSalesLedgerEntrySelect() {
  return {
    id: true,
    entryNo: true,
    franchiseId: true,
    orderNo: true,
    paymentNo: true,
    refundNo: true,
    buyerUserId: true,
    source: true,
    status: true,
    totalAmount: true,
    welfareCardAmount: true,
    onlineCashAmount: true,
    amount: true,
    createdAt: true,
    updatedAt: true
  } as const;
}

function merchantBillItemWhere(input: MerchantSettlementBillItemListInput) {
  const where: Record<string, string> = {};

  if (input.merchantId) {
    where.merchantId = input.merchantId;
  }

  if (input.status) {
    where.status = input.status;
  }

  return Object.keys(where).length > 0 ? where : undefined;
}

function merchantSettlementStatementWhere(input: MerchantSettlementStatementListInput) {
  const where: Record<string, string> = {};

  if (input.merchantId) {
    where.merchantId = input.merchantId;
  }

  if (input.status) {
    where.status = input.status;
  }

  return Object.keys(where).length > 0 ? where : undefined;
}

function createBillItemNo(orderNo: string, orderLineId: string): string {
  return `MSBI-${normalizeCodePart(orderNo)}-${normalizeCodePart(orderLineId)}`;
}

function createFranchiseSalesPaidEntryNo(orderNo: string): string {
  return `FSL-${normalizeCodePart(orderNo)}-PAID`;
}

function createFranchiseSalesRefundEntryNo(refundNo: string): string {
  return `FSL-${normalizeCodePart(refundNo)}-REFUND`;
}

function normalizeCodePart(value: string): string {
  return value.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').toUpperCase();
}
