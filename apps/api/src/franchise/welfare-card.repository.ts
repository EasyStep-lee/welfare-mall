import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WelfareCardAccountStatuses, WelfareCardLedgerEntryTypes } from './welfare-card-status';

export type WelfareCardIssueInput = {
  franchiseId: string;
  buyerUserId: string;
  requestId: string;
  amount: number;
  remark?: string;
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

export type WelfareCardIssueResult = {
  idempotentReplay: boolean;
  account: WelfareCardAccountRecord;
  ledgerEntry: WelfareCardLedgerEntryRecord;
};

@Injectable()
export class WelfareCardRepository {
  constructor(private readonly prisma: PrismaService) {}

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
