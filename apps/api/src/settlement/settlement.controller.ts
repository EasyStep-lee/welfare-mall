import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthenticatedUser } from '../auth/authenticated-user';
import { OptionalAuthGuard } from '../auth/optional-auth.guard';
import { SettlementService } from './settlement.service';

@ApiTags('settlements')
@Controller('settlements')
export class SettlementController {
  constructor(private readonly settlementService: SettlementService) {}

  @Post('merchant-bills/generate')
  async generateMerchantBillItems(@Body() input: GenerateMerchantBillItemsRequest) {
    return this.settlementService.generateMerchantBillItems({
      orderNo: input.orderNo
    });
  }

  @Get('merchant-bills')
  @UseGuards(OptionalAuthGuard)
  async listMerchantBillItems(@Req() request: RequestWithOptionalUser, @Query('merchantId') merchantId?: string, @Query('status') status?: string) {
    return this.settlementService.listMerchantBillItems({
      merchantId: resolveMerchantId(request, merchantId),
      status
    });
  }

  @Post('merchant-statements/generate')
  async generateMerchantSettlementStatement(@Body() input: GenerateMerchantSettlementStatementRequest) {
    return this.settlementService.generateMerchantSettlementStatement({
      merchantId: input.merchantId
    });
  }

  @Get('merchant-statements')
  @UseGuards(OptionalAuthGuard)
  async listMerchantSettlementStatements(
    @Req() request: RequestWithOptionalUser,
    @Query('merchantId') merchantId?: string,
    @Query('status') status?: string
  ) {
    return this.settlementService.listMerchantSettlementStatements({
      merchantId: resolveMerchantId(request, merchantId),
      status
    });
  }

  @Post('merchant-statements/:statementNo/confirm-offline-payout')
  async confirmMerchantSettlementStatementOfflinePayout(
    @Param('statementNo') statementNo: string,
    @Body() input: ConfirmMerchantSettlementStatementOfflinePayoutRequest
  ) {
    return this.settlementService.confirmMerchantSettlementStatementOfflinePayout({
      statementNo,
      paidAt: input.paidAt,
      payoutReference: input.payoutReference,
      payoutRemark: input.payoutRemark
    });
  }
}

type GenerateMerchantBillItemsRequest = {
  orderNo: string;
};

type GenerateMerchantSettlementStatementRequest = {
  merchantId: string;
};

type ConfirmMerchantSettlementStatementOfflinePayoutRequest = {
  paidAt?: string;
  payoutReference?: string;
  payoutRemark?: string;
};

type RequestWithOptionalUser = Request & {
  user?: AuthenticatedUser;
};

function resolveMerchantId(request: RequestWithOptionalUser, fallbackMerchantId: string | undefined): string | undefined {
  if (request.user?.subjectType === 'merchant') {
    return request.user.subjectId;
  }

  return fallbackMerchantId;
}
