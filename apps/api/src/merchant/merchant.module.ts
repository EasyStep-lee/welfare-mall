import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../prisma/prisma.service';
import { MerchantController } from './merchant.controller';
import { MerchantDraftContextRepository } from './merchant-draft-context.repository';

@Module({
  imports: [AuthModule],
  controllers: [MerchantController],
  providers: [PrismaService, MerchantDraftContextRepository]
})
export class MerchantModule {}
