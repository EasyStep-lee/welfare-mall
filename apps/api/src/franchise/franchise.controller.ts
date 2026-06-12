import { BadRequestException, Body, Controller, ForbiddenException, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AccessTokenPayload } from '../auth/authenticated-user';
import { AuthGuard } from '../auth/auth.guard';
import { FranchiseStatusCatalog } from './franchise-status';
import { WelfareCardService } from './welfare-card.service';

type RequestWithUser = Request & {
  user: AccessTokenPayload;
};

@ApiTags('franchises')
@Controller('franchises')
export class FranchiseController {
  constructor(private readonly welfareCardService: WelfareCardService) {}

  @Get('statuses')
  @ApiOkResponse({
    description: 'Franchise status catalog',
    schema: {
      example: [
        {
          code: 'active',
          name: '正常'
        }
      ]
    }
  })
  getStatuses() {
    return FranchiseStatusCatalog;
  }

  @Post(':franchiseId/welfare-card-batches')
  @ApiCreatedResponse({
    description: 'Create a franchise welfare-card batch with generated entity cards',
    schema: {
      example: {
        idempotentReplay: false,
        batch: {
          batchNo: 'WCB-batch-local-001',
          issuerFranchiseId: 'franchise-local-review',
          batchName: '端午福利卡批次',
          faceValueAmount: 5000,
          totalCards: 2,
          totalAmount: 10000,
          status: 'active'
        },
        cards: [
          {
            cardNo: 'WFC-batch-local-001-0001',
            bindCode: 'BIND-batch-local-001-0001',
            status: 'unbound'
          }
        ]
      }
    }
  })
  @UseGuards(AuthGuard)
  async createWelfareCardBatch(
    @Param('franchiseId') franchiseId: string,
    @Body() body: CreateWelfareCardBatchRequestBody,
    @Req() request: RequestWithUser
  ) {
    assertCanManageWelfareCardBatch(request.user, franchiseId);

    return this.welfareCardService.createWelfareCardBatch({
      franchiseId,
      requestId: normalizeRequiredText(body?.requestId, 'requestId'),
      batchName: normalizeRequiredText(body?.batchName, 'batchName'),
      faceValueAmount: normalizePositiveInteger(body?.faceValueAmount, 'faceValueAmount'),
      totalCards: normalizePositiveInteger(body?.totalCards, 'totalCards'),
      createdBy: request.user.sub,
      remark: normalizeOptionalText(body?.remark)
    });
  }

  @Post(':franchiseId/welfare-cards/issue')
  @ApiCreatedResponse({
    description: 'Issue welfare-card balance under the sales franchise',
    schema: {
      example: {
        idempotentReplay: false,
        account: {
          accountNo: 'WCA-franchise-local-review-buyer-local',
          franchiseId: 'franchise-local-review',
          buyerUserId: 'buyer-local',
          status: 'active',
          balanceAmount: 20000,
          issuedAmount: 20000
        },
        ledgerEntry: {
          ledgerNo: 'WCL-issue-local-001',
          requestId: 'issue-local-001',
          type: 'issue',
          amount: 20000,
          balanceAfter: 20000
        }
      }
    }
  })
  @UseGuards(AuthGuard)
  async issueWelfareCard(
    @Param('franchiseId') franchiseId: string,
    @Body() body: IssueWelfareCardRequestBody,
    @Req() request: RequestWithUser
  ) {
    assertCanIssueWelfareCard(request.user, franchiseId);
    const issueRequest = {
      franchiseId,
      requestId: normalizeRequiredText(body?.requestId, 'requestId'),
      buyerUserId: normalizeRequiredText(body?.buyerUserId, 'buyerUserId'),
      amount: normalizePositiveInteger(body?.amount, 'amount'),
      remark: normalizeOptionalText(body?.remark)
    };

    return this.welfareCardService.issueWelfareCard(issueRequest);
  }

  @Get(':franchiseId/welfare-card-accounts/me')
  @ApiOkResponse({
    description: 'List welfare-card accounts for the authenticated buyer under one sales franchise',
    schema: {
      example: {
        accounts: [
          {
            accountNo: 'WCA-franchise-local-review-user-001',
            franchiseId: 'franchise-local-review',
            buyerUserId: 'user-001',
            status: 'active',
            balanceAmount: 5000,
            issuedAmount: 5000
          }
        ]
      }
    }
  })
  @UseGuards(AuthGuard)
  async listMyWelfareCardAccounts(
    @Param('franchiseId') franchiseId: string,
    @Req() request: RequestWithUser
  ) {
    assertBuyerCanUseWelfareCardAccount(request.user);

    return this.welfareCardService.listBuyerWelfareCardAccounts({
      franchiseId: normalizeRequiredText(franchiseId, 'franchiseId'),
      buyerUserId: request.user.subjectId
    });
  }

  @Post(':franchiseId/welfare-cards/bind')
  @ApiCreatedResponse({
    description: 'Bind an entity welfare card into the authenticated buyer welfare-card account',
    schema: {
      example: {
        idempotentReplay: false,
        card: {
          cardNo: 'WFC-batch-local-001-0001',
          issuerFranchiseId: 'franchise-local-review',
          status: 'bound',
          boundBuyerUserId: 'user-001'
        },
        account: {
          accountNo: 'WCA-franchise-local-review-user-001',
          franchiseId: 'franchise-local-review',
          buyerUserId: 'user-001',
          balanceAmount: 5000
        },
        ledgerEntry: {
          requestId: 'bind-local-001',
          type: 'bind',
          amount: 5000,
          balanceAfter: 5000
        }
      }
    }
  })
  @UseGuards(AuthGuard)
  async bindWelfareCard(
    @Param('franchiseId') franchiseId: string,
    @Body() body: BindWelfareCardRequestBody,
    @Req() request: RequestWithUser
  ) {
    assertBuyerCanUseWelfareCardAccount(request.user);

    return this.welfareCardService.bindWelfareCard({
      franchiseId,
      buyerUserId: request.user.subjectId,
      requestId: normalizeRequiredText(body?.requestId, 'requestId'),
      cardNo: normalizeRequiredText(body?.cardNo, 'cardNo'),
      bindCode: normalizeRequiredText(body?.bindCode, 'bindCode')
    });
  }
}

function assertCanManageWelfareCardBatch(user: AccessTokenPayload, franchiseId: string) {
  if (user.subjectType === 'platform') {
    return;
  }
  if (user.subjectType === 'franchise' && user.subjectId === franchiseId) {
    return;
  }

  throw new ForbiddenException('Only the issuing franchise or platform operator can create welfare-card batches.');
}

function assertCanIssueWelfareCard(user: AccessTokenPayload, franchiseId: string) {
  if (user.subjectType === 'platform') {
    return;
  }
  if (user.subjectType === 'franchise' && user.subjectId === franchiseId) {
    return;
  }

  throw new ForbiddenException('Only the sales franchise or platform operator can issue welfare-card balance.');
}

function assertBuyerCanUseWelfareCardAccount(user: AccessTokenPayload) {
  if (user.subjectType === 'buyer') {
    return;
  }

  throw new ForbiddenException('Only a buyer user can bind a welfare card.');
}

type CreateWelfareCardBatchRequestBody = {
  requestId?: string;
  batchName?: string;
  faceValueAmount?: number;
  totalCards?: number;
  remark?: string;
};

type IssueWelfareCardRequestBody = {
  requestId?: string;
  buyerUserId?: string;
  amount?: number;
  remark?: string;
};

type BindWelfareCardRequestBody = {
  requestId?: string;
  cardNo?: string;
  bindCode?: string;
};

function normalizeRequiredText(value: string | undefined, fieldName: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new BadRequestException(`${fieldName} is required.`);
  }

  return value.trim();
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function normalizePositiveInteger(value: number | undefined, fieldName: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new BadRequestException(`${fieldName} must be a positive integer amount in cents.`);
  }

  return value;
}
