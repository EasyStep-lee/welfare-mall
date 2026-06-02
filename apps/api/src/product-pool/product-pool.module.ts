import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductPoolController } from './product-pool.controller';
import { ProductPoolRepository } from './product-pool.repository';
import { ProductPoolService } from './product-pool.service';

@Module({
  controllers: [ProductPoolController],
  providers: [PrismaService, ProductPoolRepository, ProductPoolService],
  exports: [ProductPoolRepository, ProductPoolService]
})
export class ProductPoolModule {}
