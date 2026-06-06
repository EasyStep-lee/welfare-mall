import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
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
  async listMerchantBillItems(@Query('merchantId') merchantId?: string, @Query('status') status?: string) {
    return this.settlementService.listMerchantBillItems({
      merchantId,
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
  async listMerchantSettlementStatements(@Query('merchantId') merchantId?: string, @Query('status') status?: string) {
    return this.settlementService.listMerchantSettlementStatements({
      merchantId,
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
      paidAt: input.paidAt
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
};
