import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type InventoryReservationRecord = {
  id: string;
  orderNo: string;
  orderLineId: string;
  productId: string;
  skuId: string | null;
  merchantId: string;
  quantity: number;
  status: string;
  source: string;
  releasedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ListInventoryReservationsInput = {
  status?: string;
  merchantId?: string;
  orderNo?: string;
};

export type ListInventoryReservationsResult = {
  reservations: InventoryReservationRecord[];
};

export type InventoryStockRecord = {
  id: string;
  stockKey: string;
  productId: string;
  skuId: string | null;
  merchantId: string;
  availableQuantity: number;
  reservedQuantity: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ListInventoryStocksInput = {
  merchantId?: string;
  productId?: string;
  skuId?: string;
};

export type ListInventoryStocksResult = {
  stocks: InventoryStockRecord[];
};

@Injectable()
export class OrderInventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listReservations(input: ListInventoryReservationsInput): Promise<ListInventoryReservationsResult> {
    const reservations = await this.prisma.inventoryReservation.findMany({
      where: {
        ...(input.status ? { status: input.status } : {}),
        ...(input.merchantId ? { merchantId: input.merchantId } : {}),
        ...(input.orderNo ? { orderNo: input.orderNo } : {})
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    return { reservations };
  }

  async listStocks(input: ListInventoryStocksInput): Promise<ListInventoryStocksResult> {
    const stocks = await this.prisma.inventoryStock.findMany({
      where: {
        ...(input.merchantId ? { merchantId: input.merchantId } : {}),
        ...(input.productId ? { productId: input.productId } : {}),
        ...(input.skuId ? { skuId: input.skuId } : {})
      },
      orderBy: { updatedAt: 'desc' },
      take: 100
    });

    return { stocks };
  }
}
