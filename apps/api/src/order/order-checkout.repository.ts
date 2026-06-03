import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ensurePendingPaymentOrderState, OrderStateClient } from './order-state.repository';

export type OrderFulfillmentType = 'delivery' | 'pickup';

export type OrderCheckoutLineRecord = {
  id: string;
  orderId: string;
  productPoolItemId: string;
  productId: string;
  skuId: string | null;
  displayName: string;
  displaySkuCode: string | null;
  displayImageUrl: string;
  unitPriceAmount: number;
  quantity: number;
  lineTotalAmount: number;
  createdAt: Date;
};

export type OrderCheckoutRecord = {
  id: string;
  orderNo: string;
  requestId: string;
  buyerUserId: string;
  status: string;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  welfareCardPayableAmount: number;
  cashPayableAmount: number;
  fulfillmentType: string;
  receiverName: string | null;
  receiverPhone: string | null;
  receiverAddress: string | null;
  pickupStoreName: string | null;
  createdAt: Date;
  updatedAt: Date;
  lines: OrderCheckoutLineRecord[];
};

export type CreateOrderCheckoutLineInput = {
  productPoolItemId: string;
  productId: string;
  skuId: string | null;
  displayName: string;
  displaySkuCode: string | null;
  displayImageUrl: string;
  unitPriceAmount: number;
  quantity: number;
  lineTotalAmount: number;
};

export type CreateOrderCheckoutRecordInput = {
  orderNo: string;
  requestId: string;
  buyerUserId: string;
  status: string;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  welfareCardPayableAmount: number;
  cashPayableAmount: number;
  fulfillmentType: OrderFulfillmentType;
  receiverName: string | null;
  receiverPhone: string | null;
  receiverAddress: string | null;
  pickupStoreName: string | null;
  lines: CreateOrderCheckoutLineInput[];
};

type OrderCheckoutTransaction = {
  orderHeader: {
    create(args: unknown): Promise<OrderCheckoutRecord>;
  };
} & OrderStateClient;

@Injectable()
export class OrderCheckoutRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOrderByRequestId(requestId: string): Promise<OrderCheckoutRecord | null> {
    return this.prisma.orderHeader.findUnique({
      where: { requestId },
      select: orderSelect()
    });
  }

  async createOrder(input: CreateOrderCheckoutRecordInput): Promise<OrderCheckoutRecord> {
    return this.prisma.$transaction(async (prismaTx) => {
      const tx = prismaTx as unknown as OrderCheckoutTransaction;
      const order = await tx.orderHeader.create({
        data: {
          orderNo: input.orderNo,
          requestId: input.requestId,
          buyerUserId: input.buyerUserId,
          status: input.status,
          subtotalAmount: input.subtotalAmount,
          discountAmount: input.discountAmount,
          totalAmount: input.totalAmount,
          welfareCardPayableAmount: input.welfareCardPayableAmount,
          cashPayableAmount: input.cashPayableAmount,
          fulfillmentType: input.fulfillmentType,
          receiverName: input.receiverName,
          receiverPhone: input.receiverPhone,
          receiverAddress: input.receiverAddress,
          pickupStoreName: input.pickupStoreName,
          lines: {
            create: input.lines.map((line) => ({
              productPoolItemId: line.productPoolItemId,
              productId: line.productId,
              skuId: line.skuId,
              displayName: line.displayName,
              displaySkuCode: line.displaySkuCode,
              displayImageUrl: line.displayImageUrl,
              unitPriceAmount: line.unitPriceAmount,
              quantity: line.quantity,
              lineTotalAmount: line.lineTotalAmount
            }))
          }
        },
        select: orderSelect()
      });

      await ensurePendingPaymentOrderState(tx, input.orderNo);

      return order;
    });
  }
}

function orderSelect() {
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
