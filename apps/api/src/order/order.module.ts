import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderAmountRepository } from './order-amount.repository';
import { OrderAmountService } from './order-amount.service';
import { OrderController } from './order.controller';

@Module({
  controllers: [OrderController],
  providers: [PrismaService, OrderAmountRepository, OrderAmountService],
  exports: [OrderAmountRepository, OrderAmountService]
})
export class OrderModule {}
