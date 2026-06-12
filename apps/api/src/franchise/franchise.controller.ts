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

type IssueWelfareCardRequestBody = {
  requestId?: string;
  buyerUserId?: string;
  amount?: number;
  remark?: string;
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
