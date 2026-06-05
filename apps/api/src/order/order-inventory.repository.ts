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
}
