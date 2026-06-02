import { Module } from '@nestjs/common';
import { FranchiseModule } from './franchise/franchise.module';
import { HealthModule } from './health/health.module';
import { IamModule } from './iam/iam.module';
import { MerchantModule } from './merchant/merchant.module';
import { RegionModule } from './region/region.module';

@Module({
  imports: [HealthModule, IamModule, FranchiseModule, MerchantModule, RegionModule]
})
export class AppModule {}

