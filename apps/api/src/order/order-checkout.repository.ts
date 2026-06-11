import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ensurePendingPaymentOrderState, OrderStateClient } from './order-state.repository';

export type OrderFulfillmentType = 'delivery' | 'pickup';

export type OrderCheckoutLineRecord = {
  id: string;
  orderId: string;
  productPoolItemId: string;
  productId: string;
  merchantId?: string | null;
  skuId: string | null;
  displayName: string;
  displaySkuCode: string | null;
  displayImageUrl: string;
  unitPriceAmount: number;
  quantity: number;
  lineTotalAmount: number;
  createdAt: Date;
};

export type OrderCheckoutPaymentRecord = {
  id: string;
  paymentNo: string;
  requestId: string;
  orderNo: string;
  status: string;
  channel: string;
  totalAmount: number;
  welfareCardPayableAmount: number;
  cashPayableAmount: number;
  providerPaymentNo: string | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type OrderCheckoutRefundRecord = {
  id: string;
  refundNo: string;
  requestId: string;
  paymentNo: string;
  orderNo: string;
  status: string;
  channel: string;
  refundAmount: number;
  reason: string;
  providerRefundNo: string | null;
  succeededAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
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
  salesFranchiseId: string | null;
  salesFranchiseName: string | null;
  fulfillmentMerchantId: string | null;
  fulfillmentMerchantName: string | null;
  fulfillmentMerchantAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
  lines: OrderCheckoutLineRecord[];
  latestPayment?: OrderCheckoutPaymentRecord | null;
  latestRefund?: OrderCheckoutRefundRecord | null;
  pickupCode?: string | null;
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

export class InsufficientInventoryError extends Error {
  constructor(
    readonly details: {
      productId: string;
      skuId: string | null;
      requestedQuantity: number;
    }
  ) {
    super(
      `insufficient inventory for product ${details.productId} sku ${details.skuId ?? 'default'} quantity ${details.requestedQuantity}`
    );
  }
}

type OrderCheckoutTransaction = {
  product: {
    findMany(args: unknown): Promise<OrderProductBusinessFact[]>;
  };
  inventoryStock: {
    updateMany(args: unknown): Promise<{ count: number }>;
  };
  inventoryReservation: {
    createMany(args: unknown): Promise<unknown>;
  };
  orderHeader: {
    create(args: unknown): Promise<OrderCheckoutRecord>;
  };
} & OrderStateClient;

type OrderProductBusinessFact = {
  id: string;
  franchiseId: string;
  franchise: {
    id: string;
    name: string;
  };
  merchantId: string;
  merchant: {
    id: string;
    name: string;
    address: string | null;
  };
};

type OrderBusinessSnapshot = {
  salesFranchiseId: string;
  salesFranchiseName: string;
  fulfillmentMerchantId: string | null;
  fulfillmentMerchantName: string | null;
  fulfillmentMerchantAddress: string | null;
  productFacts: OrderProductBusinessFact[];
};

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
      const businessSnapshot = await resolveOrderBusinessSnapshot(tx, input.lines);
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
          salesFranchiseId: businessSnapshot.salesFranchiseId,
          salesFranchiseName: businessSnapshot.salesFranchiseName,
          fulfillmentMerchantId: businessSnapshot.fulfillmentMerchantId,
          fulfillmentMerchantName: businessSnapshot.fulfillmentMerchantName,
          fulfillmentMerchantAddress: businessSnapshot.fulfillmentMerchantAddress,
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
      await reserveInventoryForOrder(tx, order, businessSnapshot.productFacts);

      return order;
    });
  }
}

async function resolveOrderBusinessSnapshot(
  tx: OrderCheckoutTransaction,
  lines: CreateOrderCheckoutLineInput[]
): Promise<OrderBusinessSnapshot> {
  const productIds = Array.from(new Set(lines.map((line) => line.productId)));
  const products = await tx.product.findMany({
    where: { id: { in: productIds } },
    select: productBusinessFactSelect()
  });
  const productById = new Map(products.map((product) => [product.id, product]));
  const orderedProducts = lines.map((line) => productById.get(line.productId)).filter(isDefined);
  const franchiseIds = new Set(orderedProducts.map((product) => product.franchiseId));
  const merchantIds = new Set(orderedProducts.map((product) => product.merchantId));

  if (orderedProducts.length !== productIds.length || franchiseIds.size !== 1) {
    throw new InsufficientInventoryError({
      productId: productIds[0] ?? '',
      skuId: null,
      requestedQuantity: 0
    });
  }

  const [salesFranchiseId] = Array.from(franchiseIds);
  const salesFranchise = orderedProducts.find((product) => product.franchiseId === salesFranchiseId)?.franchise;
  if (!salesFranchiseId || !salesFranchise) {
    throw new InsufficientInventoryError({
      productId: productIds[0] ?? '',
      skuId: null,
      requestedQuantity: 0
    });
  }

  const singleMerchant = merchantIds.size === 1 ? orderedProducts[0]?.merchant ?? null : null;

  return {
    salesFranchiseId,
    salesFranchiseName: salesFranchise.name,
    fulfillmentMerchantId: singleMerchant?.id ?? null,
    fulfillmentMerchantName: singleMerchant?.name ?? null,
    fulfillmentMerchantAddress: singleMerchant?.address ?? null,
    productFacts: products
  };
}

async function reserveInventoryForOrder(
  tx: OrderCheckoutTransaction,
  order: OrderCheckoutRecord,
  products: OrderProductBusinessFact[]
): Promise<void> {
  if (order.lines.length === 0) {
    return;
  }

  const merchantIdByProductId = new Map(products.map((product) => [product.id, product.merchantId]));
  const reservations = [];

  for (const line of order.lines) {
    const merchantId = merchantIdByProductId.get(line.productId);
    if (!merchantId) {
      throw new InsufficientInventoryError({
        productId: line.productId,
        skuId: line.skuId,
        requestedQuantity: line.quantity
      });
    }

    const reserved = await tx.inventoryStock.updateMany({
      where: {
        stockKey: inventoryStockKey(line.productId, line.skuId),
        availableQuantity: { gte: line.quantity }
      },
      data: {
        availableQuantity: { decrement: line.quantity },
        reservedQuantity: { increment: line.quantity }
      }
    });

    if (reserved.count !== 1) {
      throw new InsufficientInventoryError({
        productId: line.productId,
        skuId: line.skuId,
        requestedQuantity: line.quantity
      });
    }

    reservations.push({
      orderNo: order.orderNo,
      orderLineId: line.id,
      productId: line.productId,
      skuId: line.skuId,
      merchantId,
      quantity: line.quantity,
      status: 'reserved',
      source: 'order_checkout'
    });
  }

  await tx.inventoryReservation.createMany({
    data: reservations,
    skipDuplicates: true
  });
}

function productBusinessFactSelect() {
  return {
    id: true,
    franchiseId: true,
    franchise: {
      select: {
        id: true,
        name: true
      }
    },
    merchantId: true,
    merchant: {
      select: {
        id: true,
        name: true,
        address: true
      }
    }
  } as const;
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

function inventoryStockKey(productId: string, skuId: string | null): string {
  return `${productId}:${skuId ?? 'default'}`;
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
    salesFranchiseId: true,
    salesFranchiseName: true,
    fulfillmentMerchantId: true,
    fulfillmentMerchantName: true,
    fulfillmentMerchantAddress: true,
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
