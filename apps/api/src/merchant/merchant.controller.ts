import { BadRequestException, Controller, Get, NotFoundException, Param, Req, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthenticatedUser } from '../auth/authenticated-user';
import { OptionalAuthGuard } from '../auth/optional-auth.guard';
import { MerchantDraftContextRepository } from './merchant-draft-context.repository';
import { MerchantStatusCatalog } from './merchant-status';

@ApiTags('merchants')
@Controller('merchants')
export class MerchantController {
  constructor(private readonly merchantDraftContextRepository: MerchantDraftContextRepository) {}

  @Get('statuses')
  @ApiOkResponse({
    description: 'Merchant status catalog',
    schema: {
      example: [
        {
          code: 'pending_review',
          name: '待审核'
        }
      ]
    }
  })
  getStatuses() {
    return MerchantStatusCatalog;
  }

  @Get(':merchantId/draft-context')
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    description: 'Merchant product draft context derived from the merchant and product master data',
    schema: {
      example: {
        merchant: { id: 'merchant-001', code: 'M-001', name: '浦东履约商户', address: '上海市浦东新区世纪大道 88 号' },
        franchise: { id: 'franchise-001', code: 'F-001', name: '浦东福利加盟商' },
        defaultCategory: { id: 'category-001', code: 'grain', name: '粮油副食' },
        defaultBrand: { id: 'brand-001', code: 'wuchang', name: '五常香米' }
      }
    }
  })
  async getDraftContext(@Req() request: RequestWithOptionalUser, @Param('merchantId') merchantId: string) {
    const resolvedMerchantId = resolveMerchantId(request, merchantId);
    const context = await this.merchantDraftContextRepository.getDraftContext(resolvedMerchantId);
    if (!context) {
      throw new NotFoundException(`Merchant ${resolvedMerchantId} was not found.`);
    }

    return context;
  }
}

type RequestWithOptionalUser = Request & {
  user?: AuthenticatedUser;
};

function resolveMerchantId(request: RequestWithOptionalUser, fallbackMerchantId: string | undefined): string {
  if (request.user?.subjectType === 'merchant') {
    return request.user.subjectId;
  }

  if (typeof fallbackMerchantId !== 'string' || fallbackMerchantId.trim().length === 0) {
    throw new BadRequestException('merchantId is required.');
  }

  return fallbackMerchantId.trim();
}
