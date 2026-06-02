import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductController } from './product.controller';
import { ProductDraftRepository } from './product-draft.repository';
import { ProductDraftSaveService } from './product-draft-save.service';
import { ProductMasterRepository } from './product-master.repository';
import { ProductReviewDecisionRepository } from './product-review-decision.repository';
import { ProductReviewDecisionService } from './product-review-decision.service';
import { ProductReviewQueueRepository } from './product-review-queue.repository';
import { ProductReviewQueueService } from './product-review-queue.service';
import { ProductReviewSubmissionRepository } from './product-review-submission.repository';
import { ProductReviewSubmissionService } from './product-review-submission.service';

@Module({
  controllers: [ProductController],
  providers: [
    PrismaService,
    ProductDraftRepository,
    ProductMasterRepository,
    ProductDraftSaveService,
    ProductReviewDecisionRepository,
    ProductReviewDecisionService,
    ProductReviewQueueRepository,
    ProductReviewQueueService,
    ProductReviewSubmissionRepository,
    ProductReviewSubmissionService
  ],
  exports: [
    ProductDraftRepository,
    ProductMasterRepository,
    ProductDraftSaveService,
    ProductReviewDecisionRepository,
    ProductReviewDecisionService,
    ProductReviewQueueRepository,
    ProductReviewQueueService,
    ProductReviewSubmissionRepository,
    ProductReviewSubmissionService
  ]
})
export class ProductModule {}
