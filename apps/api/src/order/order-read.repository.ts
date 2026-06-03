import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderCheckoutRecord } from './order-checkout.repository';

export type FindOrderForBuyerInput = {
  buyerUserId: string;
  orderNo: string;
};

@Injectable()
export class OrderReadRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listOrdersByBuyer(buyerUserId: string): Promise<OrderCheckoutRecord[]> {
    return this.prisma.orderHeader.findMany({
      where: { buyerUserId },
      orderBy: { createdAt: 'desc' },
      select: orderReadSelect()
    });
  }

  async findOrderForBuyer(input: FindOrderForBuyerInput): Promise<OrderCheckoutRecord | null> {
    return this.prisma.orderHeader.findFirst({
      where: {
        buyerUserId: input.buyerUserId,
        orderNo: input.orderNo
      },
      select: orderReadSelect()
    });
  }
}

function orderReadSelect() {
  return {
    id: true,
    orderNo: true,
    requestId: true,
    buyerUserId: true,
    status: true,
    subtotalAmount: true,
    discountAmount: true,
    totalAmount: true,
    welfareCardPayableAmount: true,
    cashPayableAmount: true,
    fulfillmentType: true,
    receiverName: true,
    receiverPhone: true,
    receiverAddress: true,
    pickupStoreName: true,
    createdAt: true,
    updatedAt: true,
    lines: {
      select: {
        id: true,
        orderId: true,
        productPoolItemId: true,
        productId: true,
        skuId: true,
        displayName: true,
        displaySkuCode: true,
        displayImageUrl: true,
        unitPriceAmount: true,
        quantity: true,
        lineTotalAmount: true,
        createdAt: true
      }
    }
  } as const;
}
