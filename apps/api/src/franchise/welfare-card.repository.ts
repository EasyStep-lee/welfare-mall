import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  WelfareCardAccountStatuses,
  WelfareCardBatchStatuses,
  WelfareCardLedgerEntryTypes,
  WelfareCardStatuses
} from './welfare-card-status';

export type WelfareCardIssueInput = {
  franchiseId: string;
  buyerUserId: string;
  requestId: string;
  amount: number;
  remark?: string;
};

export type CreateWelfareCardBatchInput = {
  franchiseId: string;
  requestId: string;
  batchName: string;
  faceValueAmount: number;
  totalCards: number;
  createdBy: string;
  remark?: string;
};

export type BindWelfareCardInput = {
  franchiseId: string;
  buyerUserId: string;
  requestId: string;
  cardNo: string;
  bindCode: string;
};

export type ListBuyerWelfareCardAccountsInput = {
  franchiseId: string;
  buyerUserId: string;
};

export type WelfareCardAccountRecord = {
  id: string;
  accountNo: string;
  franchiseId: string;
  buyerUserId: string;
  status: string;
  balanceAmount: number;
  issuedAmount: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export type WelfareCardLedgerEntryRecord = {
  id: string;
  ledgerNo: string;
  requestId: string;
  accountId: string;
  franchiseId: string;
  buyerUserId: string;
  type: string;
  amount: number;
  balanceAfter: number;
  orderNo?: string | null;
  remark?: string | null;
  createdAt?: Date;
};

export type WelfareCardBatchRecord = {
  id: string;
  batchNo: string;
  requestId: string;
  issuerFranchiseId: string;
  batchName: string;
  faceValueAmount: number;
  totalCards: number;
  totalAmount: number;
  status: string;
  createdBy: string;
  remark?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type WelfareCardRecord = {
  id: string;
  cardNo: string;
  bindCode: string;
  batchId: string;
  issuerFranchiseId: string;
  faceValueAmount: number;
  status: string;
  boundBuyerUserId?: string | null;
  boundAccountId?: string | null;
  boundAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type WelfareCardIssueResult = {
  idempotentReplay: boolean;
  account: WelfareCardAccountRecord;
  ledgerEntry: WelfareCardLedgerEntryRecord;
};

export type WelfareCardBatchCreateResult = {
  idempotentReplay: boolean;
  batch: WelfareCardBatchRecord;
  cards: WelfareCardRecord[];
};

export type WelfareCardBindResult = {
  idempotentReplay: boolean;
  card: WelfareCardRecord;
  account: WelfareCardAccountRecord;
  ledgerEntry: WelfareCardLedgerEntryRecord;
};

export type BuyerWelfareCardAccountsResult = {
  accounts: WelfareCardAccountRecord[];
};

@Injectable()
export class WelfareCardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listBuyerWelfareCardAccounts(input: ListBuyerWelfareCardAccountsInput): Promise<BuyerWelfareCardAccountsResult> {
    const accounts = await this.prisma.welfareCardAccount.findMany({
      where: {
        franchiseId: input.franchiseId,
        buyerUserId: input.buyerUserId,
        status: WelfareCardAccountStatuses.Active
      },
      orderBy: { updatedAt: 'desc' },
      select: welfareCardAccountSelect()
    });

    return { accounts };
  }

  async createWelfareCardBatch(input: CreateWelfareCardBatchInput): Promise<WelfareCardBatchCreateResult> {
    return this.prisma.$transaction(async (tx) => {
      const existingBatch = await tx.welfareCardBatch.findUnique({
        where: { requestId: input.requestId },
        select: {
          ...welfareCardBatchSelect(),
          cards: {
            orderBy: { cardNo: 'asc' },
            select: welfareCardSelect()
          }
        }
      });

      if (existingBatch) {
        const { cards, ...batch } = existingBatch;
        return {
          idempotentReplay: true,
          batch,
          cards
        };
      }

      const batchNo = createBatchNo(input.requestId);
      const batch = await tx.welfareCardBatch.create({
        data: {
          batchNo,
          requestId: input.requestId,
          issuerFranchiseId: input.franchiseId,
          batchName: input.batchName,
          faceValueAmount: input.faceValueAmount,
          totalCards: input.totalCards,
          totalAmount: input.faceValueAmount * input.totalCards,
          status: WelfareCardBatchStatuses.Active,
          createdBy: input.createdBy,
          remark: input.remark ?? null
        },
        select: welfareCardBatchSelect()
      });

      await tx.welfareCard.createMany({
        data: Array.from({ length: input.totalCards }, (_, index) => ({
          cardNo: createCardNo(input.requestId, index + 1),
          bindCode: createBindCode(input.requestId, index + 1),
          batchId: batch.id,
          issuerFranchiseId: input.franchiseId,
          faceValueAmount: input.faceValueAmount,
          status: WelfareCardStatuses.Unbound
        }))
      });

      const cards = await tx.welfareCard.findMany({
        where: { batchId: batch.id },
        orderBy: { cardNo: 'asc' },
        select: welfareCardSelect()
      });

      return {
        idempotentReplay: false,
        batch,
        cards
      };
    });
  }

  async issueWelfareCard(input: WelfareCardIssueInput): Promise<WelfareCardIssueResult> {
    return this.prisma.$transaction(async (tx) => {
      const existingLedger = await tx.welfareCardLedgerEntry.findUnique({
        where: { requestId: input.requestId },
        select: {
          ...welfareCardLedgerEntrySelect(),
          account: { select: welfareCardAccountSelect() }
        }
      });

      if (existingLedger) {
        const { account, ...ledgerEntry } = existingLedger;
        return {
          idempotentReplay: true,
          account,
          ledgerEntry
        };
      }

      const account = await tx.welfareCardAccount.upsert({
        where: {
          franchiseId_buyerUserId: {
            franchiseId: input.franchiseId,
            buyerUserId: input.buyerUserId
          }
        },
        create: {
          accountNo: createAccountNo(input.franchiseId, input.buyerUserId),
          franchiseId: input.franchiseId,
          buyerUserId: input.buyerUserId,
          status: WelfareCardAccountStatuses.Active,
          balanceAmount: 0,
          issuedAmount: 0
        },
        update: {},
        select: welfareCardAccountSelect()
      });

      const creditedAccount = await tx.welfareCardAccount.update({
        where: { id: account.id },
        data: {
          balanceAmount: { increment: input.amount },
          issuedAmount: { increment: input.amount }
        },
        select: welfareCardAccountSelect()
      });

      const ledgerEntry = await tx.welfareCardLedgerEntry.create({
        data: {
          ledgerNo: createLedgerNo(input.requestId),
          requestId: input.requestId,
          accountId: account.id,
          franchiseId: input.franchiseId,
          buyerUserId: input.buyerUserId,
          type: WelfareCardLedgerEntryTypes.Issue,
          amount: input.amount,
          balanceAfter: creditedAccount.balanceAmount,
          remark: input.remark ?? null
        },
        select: welfareCardLedgerEntrySelect()
      });

      return {
        idempotentReplay: false,
        account: creditedAccount,
        ledgerEntry
      };
    });
  }

  async bindWelfareCard(input: BindWelfareCardInput): Promise<WelfareCardBindResult> {
    return this.prisma.$transaction(async (tx) => {
      const existingLedger = await tx.welfareCardLedgerEntry.findUnique({
        where: { requestId: input.requestId },
        select: {
          ...welfareCardLedgerEntrySelect(),
          account: { select: welfareCardAccountSelect() }
        }
      });

      if (existingLedger) {
        const { account, ...ledgerEntry } = existingLedger;
        const card = await tx.welfareCard.findFirst({
          where: { boundAccountId: account.id, issuerFranchiseId: input.franchiseId },
          select: welfareCardSelect()
        });
        if (!card) {
          throw new BadRequestException(`Welfare card binding replay ${input.requestId} is missing bound card.`);
        }

        return {
          idempotentReplay: true,
          card,
          account,
          ledgerEntry
        };
      }

      const card = await tx.welfareCard.findFirst({
        where: {
          cardNo: input.cardNo,
          bindCode: input.bindCode,
          issuerFranchiseId: input.franchiseId
        },
        select: welfareCardSelect()
      });

      if (!card) {
        throw new BadRequestException('Welfare card number or bind code is invalid for this franchise.');
      }
      if (card.status !== WelfareCardStatuses.Unbound) {
        throw new BadRequestException('Welfare card has already been bound.');
      }

      const account = await tx.welfareCardAccount.upsert({
        where: {
          franchiseId_buyerUserId: {
            franchiseId: input.franchiseId,
            buyerUserId: input.buyerUserId
          }
        },
        create: {
          accountNo: createAccountNo(input.franchiseId, input.buyerUserId),
          franchiseId: input.franchiseId,
          buyerUserId: input.buyerUserId,
          status: WelfareCardAccountStatuses.Active,
          balanceAmount: 0,
          issuedAmount: 0
        },
        update: {},
        select: welfareCardAccountSelect()
      });

      const creditedAccount = await tx.welfareCardAccount.update({
        where: { id: account.id },
        data: {
          balanceAmount: { increment: card.faceValueAmount },
          issuedAmount: { increment: card.faceValueAmount }
        },
        select: welfareCardAccountSelect()
      });

      const boundCard = await tx.welfareCard.update({
        where: { id: card.id },
        data: {
          status: WelfareCardStatuses.Bound,
          boundBuyerUserId: input.buyerUserId,
          boundAccountId: account.id,
          boundAt: new Date()
        },
        select: welfareCardSelect()
      });

      const ledgerEntry = await tx.welfareCardLedgerEntry.create({
        data: {
          ledgerNo: createLedgerNo(input.requestId),
          requestId: input.requestId,
          accountId: account.id,
          franchiseId: input.franchiseId,
          buyerUserId: input.buyerUserId,
          type: WelfareCardLedgerEntryTypes.Bind,
          amount: card.faceValueAmount,
          balanceAfter: creditedAccount.balanceAmount,
          remark: `绑定实体福利卡 ${card.cardNo}`
        },
        select: welfareCardLedgerEntrySelect()
      });

      return {
        idempotentReplay: false,
        card: boundCard,
        account: creditedAccount,
        ledgerEntry
      };
    });
  }
}

function welfareCardAccountSelect(): Prisma.WelfareCardAccountSelect {
  return {
    id: true,
    accountNo: true,
    franchiseId: true,
    buyerUserId: true,
    status: true,
    balanceAmount: true,
    issuedAmount: true,
    createdAt: true,
    updatedAt: true
  };
}

function welfareCardLedgerEntrySelect(): Prisma.WelfareCardLedgerEntrySelect {
  return {
    id: true,
    ledgerNo: true,
    requestId: true,
    accountId: true,
    franchiseId: true,
    buyerUserId: true,
    type: true,
    amount: true,
    balanceAfter: true,
    orderNo: true,
    remark: true,
    createdAt: true
  };
}

function welfareCardBatchSelect(): Prisma.WelfareCardBatchSelect {
  return {
    id: true,
    batchNo: true,
    requestId: true,
    issuerFranchiseId: true,
    batchName: true,
    faceValueAmount: true,
    totalCards: true,
    totalAmount: true,
    status: true,
    createdBy: true,
    remark: true,
    createdAt: true,
    updatedAt: true
  };
}

function welfareCardSelect(): Prisma.WelfareCardSelect {
  return {
    id: true,
    cardNo: true,
    bindCode: true,
    batchId: true,
    issuerFranchiseId: true,
    faceValueAmount: true,
    status: true,
    boundBuyerUserId: true,
    boundAccountId: true,
    boundAt: true,
    createdAt: true,
    updatedAt: true
  };
}

function createBatchNo(requestId: string): string {
  return `WCB-${normalizeIdentifier(requestId)}`;
}

function createCardNo(requestId: string, sequenceNo: number): string {
  return `WFC-${normalizeIdentifier(requestId)}-${sequenceNo.toString().padStart(4, '0')}`;
}

function createBindCode(requestId: string, sequenceNo: number): string {
  return `BIND-${normalizeIdentifier(requestId)}-${sequenceNo.toString().padStart(4, '0')}`;
}

function createAccountNo(franchiseId: string, buyerUserId: string): string {
  return `WCA-${normalizeIdentifier(franchiseId)}-${normalizeIdentifier(buyerUserId)}`;
}

function createLedgerNo(requestId: string): string {
  return `WCL-${normalizeIdentifier(requestId)}`;
}

function normalizeIdentifier(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
