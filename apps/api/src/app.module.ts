import { Module } from '@nestjs/common';
import { FranchiseModule } from './franchise/franchise.module';
import { HealthModule } from './health/health.module';
import { IamModule } from './iam/iam.module';
import { MerchantModule } from './merchant/merchant.module';
import { OrderModule } from './order/order.module';
import { ProductPoolModule } from './product-pool/product-pool.module';
import { ProductModule } from './product/product.module';
import { RegionModule } from './region/region.module';
import { SettlementModule } from './settlement/settlement.module';

@Module({
  imports: [
    HealthModule,
    IamModule,
    FranchiseModule,
    MerchantModule,
    RegionModule,
    ProductModule,
    ProductPoolModule,
    OrderModule,
    SettlementModule
  ]
})
export class AppModule {}

