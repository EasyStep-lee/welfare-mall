import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderAmountRepository } from './order-amount.repository';
import { OrderAmountService } from './order-amount.service';
import { OrderController } from './order.controller';
import { OrderPaymentRepository } from './order-payment.repository';
import { OrderPaymentService } from './order-payment.service';
import { OrderRefundRepository } from './order-refund.repository';
import { OrderRefundService } from './order-refund.service';

@Module({
  controllers: [OrderController],
  providers: [
    PrismaService,
    OrderAmountRepository,
    OrderAmountService,
    OrderPaymentRepository,
    OrderPaymentService,
    OrderRefundRepository,
    OrderRefundService
  ],
  exports: [
    OrderAmountRepository,
    OrderAmountService,
    OrderPaymentRepository,
    OrderPaymentService,
    OrderRefundRepository,
    OrderRefundService
  ]
})
export class OrderModule {}
