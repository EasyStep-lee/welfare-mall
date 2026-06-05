import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MerchantSettlementBillSources, MerchantSettlementBillStatuses } from './settlement-status';

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
  createdAt: Date;
  updatedAt: Date;
};

export type MerchantSettlementBillItemListInput = {
  merchantId?: string;
  status?: string;
};

export type MerchantSettlementBillItemListResult = {
  items: MerchantSettlementBillItemRecord[];
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

  async listMerchantBillItems(input: MerchantSettlementBillItemListInput = {}): Promise<MerchantSettlementBillItemListResult> {
    const items = await this.prisma.merchantSettlementBillItem.findMany({
      where: merchantBillItemWhere(input),
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: merchantSettlementBillItemSelect()
    });

    return { items };
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

function createBillItemNo(orderNo: string, orderLineId: string): string {
  return `MSBI-${normalizeCodePart(orderNo)}-${normalizeCodePart(orderLineId)}`;
}

function normalizeCodePart(value: string): string {
  return value.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').toUpperCase();
}
