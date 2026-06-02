import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductController } from './product.controller';
import { ProductDraftRepository } from './product-draft.repository';
import { ProductMasterRepository } from './product-master.repository';

@Module({
  controllers: [ProductController],
  providers: [PrismaService, ProductDraftRepository, ProductMasterRepository],
  exports: [ProductDraftRepository, ProductMasterRepository]
})
export class ProductModule {}
