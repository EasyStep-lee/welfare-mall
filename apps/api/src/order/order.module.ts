import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderAmountRepository } from './order-amount.repository';
import { OrderAmountService } from './order-amount.service';
import { OrderController } from './order.controller';
import { OrderPaymentRepository } from './order-payment.repository';
import { OrderPaymentService } from './order-payment.service';

@Module({
  controllers: [OrderController],
  providers: [PrismaService, OrderAmountRepository, OrderAmountService, OrderPaymentRepository, OrderPaymentService],
  exports: [OrderAmountRepository, OrderAmountService, OrderPaymentRepository, OrderPaymentService]
})
export class OrderModule {}
