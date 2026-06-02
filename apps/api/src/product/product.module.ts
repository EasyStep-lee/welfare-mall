import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductController } from './product.controller';
import { ProductDraftRepository } from './product-draft.repository';
import { ProductDraftSaveService } from './product-draft-save.service';
import { ProductMasterRepository } from './product-master.repository';

@Module({
  controllers: [ProductController],
  providers: [PrismaService, ProductDraftRepository, ProductMasterRepository, ProductDraftSaveService],
  exports: [ProductDraftRepository, ProductMasterRepository, ProductDraftSaveService]
})
export class ProductModule {}
