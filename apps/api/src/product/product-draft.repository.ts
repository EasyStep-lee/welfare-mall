import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { ProductDraftCommandInput } from './product-draft-command';

export type SaveProductDraftSnapshotInput = {
  productId: string;
  payload: ProductDraftCommandInput;
  createdBy: string;
};

export type ProductDraftSnapshotSummary = {
  id: string;
  productId: string;
  versionNo: number;
  payload: ProductDraftCommandInput;
  createdBy: string;
  createdAt: Date;
};

type ProductDraftSnapshotRow = {
  id: string;
  productId: string;
  versionNo: number;
  payload: Prisma.JsonValue;
  createdBy: string;
  createdAt: Date;
};

@Injectable()
export class ProductDraftRepository {
  constructor(private readonly prisma: PrismaService) {}

  async saveSnapshot(input: SaveProductDraftSnapshotInput): Promise<ProductDraftSnapshotSummary> {
    const latestSnapshot = await this.prisma.productDraftSnapshot.findFirst({
      where: { productId: input.productId },
      orderBy: { versionNo: 'desc' },
      select: { versionNo: true }
    });
    const versionNo = (latestSnapshot?.versionNo ?? 0) + 1;

    const snapshot = await this.prisma.productDraftSnapshot.create({
      data: {
        productId: input.productId,
        versionNo,
        payload: input.payload as Prisma.InputJsonValue,
        createdBy: input.createdBy
      }
    });

    return toProductDraftSnapshotSummary(snapshot);
  }

  async findLatestSnapshot(productId: string): Promise<ProductDraftSnapshotSummary | null> {
    const snapshot = await this.prisma.productDraftSnapshot.findFirst({
      where: { productId },
      orderBy: { versionNo: 'desc' }
    });

    return snapshot ? toProductDraftSnapshotSummary(snapshot) : null;
  }
}

function toProductDraftSnapshotSummary(snapshot: ProductDraftSnapshotRow): ProductDraftSnapshotSummary {
  return {
    id: snapshot.id,
    productId: snapshot.productId,
    versionNo: snapshot.versionNo,
    payload: snapshot.payload as ProductDraftCommandInput,
    createdBy: snapshot.createdBy,
    createdAt: snapshot.createdAt
  };
}
