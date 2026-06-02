import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductController } from './product.controller';
import { ProductDraftRepository } from './product-draft.repository';

@Module({
  controllers: [ProductController],
  providers: [PrismaService, ProductDraftRepository],
  exports: [ProductDraftRepository]
})
export class ProductModule {}
