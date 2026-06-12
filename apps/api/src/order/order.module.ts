import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../prisma/prisma.service';
import { SettlementModule } from '../settlement/settlement.module';
import { OrderAmountRepository } from './order-amount.repository';
import { OrderAmountService } from './order-amount.service';
import { OrderCancelRepository } from './order-cancel.repository';
import { OrderCancelService } from './order-cancel.service';
import { OrderCheckoutRepository } from './order-checkout.repository';
import { OrderCheckoutService } from './order-checkout.service';
import { OrderController } from './order.controller';
import { OrderFulfillmentRepository } from './order-fulfillment.repository';
import { OrderFulfillmentService } from './order-fulfillment.service';
import { OrderInventoryRepository } from './order-inventory.repository';
import { OrderInventoryService } from './order-inventory.service';
import { OrderPaymentRepository } from './order-payment.repository';
import { OrderPaymentService } from './order-payment.service';
import { OrderReadRepository } from './order-read.repository';
import { OrderReadService } from './order-read.service';
import { OrderRefundRepository } from './order-refund.repository';
import { createRefundChannelProviderFromEnv, REFUND_CHANNEL_PROVIDER } from './order-refund-provider';
import { OrderRefundService } from './order-refund.service';
import { OrderStateRepository } from './order-state.repository';

@Module({
  imports: [AuthModule, SettlementModule],
  controllers: [OrderController],
  providers: [
    PrismaService,
    OrderAmountRepository,
    OrderAmountService,
    OrderCancelRepository,
    OrderCancelService,
    OrderCheckoutRepository,
    OrderCheckoutService,
    OrderFulfillmentRepository,
    OrderFulfillmentService,
    OrderInventoryRepository,
    OrderInventoryService,
    OrderPaymentRepository,
    OrderPaymentService,
    OrderReadRepository,
    OrderReadService,
    {
      provide: REFUND_CHANNEL_PROVIDER,
      useFactory: () => createRefundChannelProviderFromEnv()
    },
    OrderRefundRepository,
    OrderRefundService,
    OrderStateRepository
  ],
  exports: [
    OrderAmountRepository,
    OrderAmountService,
    OrderCancelRepository,
    OrderCancelService,
    OrderCheckoutRepository,
    OrderCheckoutService,
    OrderFulfillmentRepository,
    OrderFulfillmentService,
    OrderInventoryRepository,
    OrderInventoryService,
    OrderPaymentRepository,
    OrderPaymentService,
    OrderReadRepository,
    OrderReadService,
    OrderRefundRepository,
    OrderRefundService,
    OrderStateRepository
  ]
})
export class OrderModule {}
