import { Module } from '@nestjs/common';
import { ProductPoolController } from './product-pool.controller';

@Module({
  controllers: [ProductPoolController]
})
export class ProductPoolModule {}
