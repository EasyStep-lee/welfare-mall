import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderAmountRepository } from './order-amount.repository';
import { OrderAmountService } from './order-amount.service';
import { OrderCheckoutRepository } from './order-checkout.repository';
import { OrderCheckoutService } from './order-checkout.service';
import { OrderController } from './order.controller';
import { OrderPaymentRepository } from './order-payment.repository';
import { OrderPaymentService } from './order-payment.service';
import { OrderRefundRepository } from './order-refund.repository';
import { OrderRefundService } from './order-refund.service';
import { OrderStateRepository } from './order-state.repository';

@Module({
  controllers: [OrderController],
  providers: [
    PrismaService,
    OrderAmountRepository,
    OrderAmountService,
    OrderCheckoutRepository,
    OrderCheckoutService,
    OrderPaymentRepository,
    OrderPaymentService,
    OrderRefundRepository,
    OrderRefundService,
    OrderStateRepository
  ],
  exports: [
    OrderAmountRepository,
    OrderAmountService,
    OrderCheckoutRepository,
    OrderCheckoutService,
    OrderPaymentRepository,
    OrderPaymentService,
    OrderRefundRepository,
    OrderRefundService,
    OrderStateRepository
  ]
})
export class OrderModule {}
