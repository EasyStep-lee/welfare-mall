import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { OrderAmountService } from './order-amount.service';
import { OrderStatuses } from './order-status';
import {
  InsufficientInventoryError,
  OrderCheckoutRecord,
  OrderCheckoutRepository,
  OrderFulfillmentType
} from './order-checkout.repository';

export type OrderCheckoutInput = {
  requestId: string;
  buyerUserId: string;
  items: Array<{
    productPoolItemId: string;
    quantity: number;
  }>;
  welfareCardPaymentAmount?: number;
  fulfillment: {
    type: OrderFulfillmentType;
    receiverName?: string | null;
    receiverPhone?: string | null;
    receiverAddress?: string | null;
    pickupStoreName?: string | null;
  };
};

export type OrderCheckoutResult = {
  idempotentReplay: boolean;
  order: OrderCheckoutRecord;
};

@Injectable()
export class OrderCheckoutService {
  constructor(
    private readonly orderAmountService: OrderAmountService,
    private readonly orderCheckoutRepository: OrderCheckoutRepository
  ) {}

  async createOrder(input: OrderCheckoutInput): Promise<OrderCheckoutResult> {
    assertCheckoutInput(input);

    const normalizedInput = normalizeCheckoutInput(input);
    const existingOrder = await this.orderCheckoutRepository.findOrderByRequestId(normalizedInput.requestId);

    if (existingOrder) {
      if (!isSameCheckoutRequest(existingOrder, normalizedInput)) {
        throw new ConflictException('requestId has already been used for a different checkout request.');
      }

      return {
        idempotentReplay: true,
        order: existingOrder
      };
    }

    const amountPreview = await this.orderAmountService.previewAmount({
      items: normalizedInput.items,
      welfareCardPaymentAmount: normalizedInput.welfareCardPaymentAmount
    });
    const order = await this.createOrderWithInventoryReservation(normalizedInput, amountPreview);

    return {
      idempotentReplay: false,
      order
    };
  }

  private async createOrderWithInventoryReservation(
    normalizedInput: OrderCheckoutInput,
    amountPreview: Awaited<ReturnType<OrderAmountService['previewAmount']>>
  ): Promise<OrderCheckoutRecord> {
    try {
      return await this.orderCheckoutRepository.createOrder({
        orderNo: createOrderNo(),
        requestId: normalizedInput.requestId,
        buyerUserId: normalizedInput.buyerUserId,
        status: OrderStatuses.PendingPayment,
        subtotalAmount: amountPreview.subtotalAmount,
        discountAmount: amountPreview.discountAmount,
        totalAmount: amountPreview.totalAmount,
        welfareCardPayableAmount: amountPreview.welfareCardPayableAmount,
        cashPayableAmount: amountPreview.cashPayableAmount,
        fulfillmentType: normalizedInput.fulfillment.type,
        receiverName: normalizedInput.fulfillment.receiverName ?? null,
        receiverPhone: normalizedInput.fulfillment.receiverPhone ?? null,
        receiverAddress: normalizedInput.fulfillment.receiverAddress ?? null,
        pickupStoreName: normalizedInput.fulfillment.pickupStoreName ?? null,
        lines: amountPreview.lines.map((line) => ({
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
      });
    } catch (error) {
      if (error instanceof InsufficientInventoryError) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }
}

function assertCheckoutInput(input: OrderCheckoutInput): void {
  const messages: string[] = [];

  if (typeof input?.requestId !== 'string' || input.requestId.trim().length === 0) {
    messages.push('requestId is required.');
  }

  if (typeof input?.buyerUserId !== 'string' || input.buyerUserId.trim().length === 0) {
    messages.push('buyerUserId is required.');
  }

  if (!Array.isArray(input?.items) || input.items.length === 0) {
    messages.push('items must contain at least one product pool item.');
  }

  for (const [index, item] of (input?.items ?? []).entries()) {
    if (typeof item?.productPoolItemId !== 'string' || item.productPoolItemId.trim().length === 0) {
      messages.push(`items[${index}].productPoolItemId is required.`);
    }

    if (!Number.isInteger(item?.quantity) || item.quantity <= 0) {
      messages.push(`items[${index}].quantity must be a positive integer.`);
    }
  }

  if (
    input?.welfareCardPaymentAmount !== undefined &&
    (!Number.isInteger(input.welfareCardPaymentAmount) || input.welfareCardPaymentAmount < 0)
  ) {
    messages.push('welfareCardPaymentAmount must be a non-negative integer.');
  }

  if (input?.fulfillment?.type !== 'delivery' && input?.fulfillment?.type !== 'pickup') {
    messages.push('fulfillment.type must be delivery or pickup.');
  }

  if (input?.fulfillment?.type === 'delivery') {
    if (typeof input.fulfillment.receiverName !== 'string' || input.fulfillment.receiverName.trim().length === 0) {
      messages.push('fulfillment.receiverName is required for delivery.');
    }

    if (typeof input.fulfillment.receiverPhone !== 'string' || input.fulfillment.receiverPhone.trim().length === 0) {
      messages.push('fulfillment.receiverPhone is required for delivery.');
    }

    if (typeof input.fulfillment.receiverAddress !== 'string' || input.fulfillment.receiverAddress.trim().length === 0) {
      messages.push('fulfillment.receiverAddress is required for delivery.');
    }
  }

  if (
    input?.fulfillment?.type === 'pickup' &&
    (typeof input.fulfillment.pickupStoreName !== 'string' || input.fulfillment.pickupStoreName.trim().length === 0)
  ) {
    messages.push('fulfillment.pickupStoreName is required for pickup.');
  }

  if (messages.length > 0) {
    throw new BadRequestException(messages);
  }
}

function normalizeCheckoutInput(input: OrderCheckoutInput): OrderCheckoutInput {
  return {
    requestId: input.requestId.trim(),
    buyerUserId: input.buyerUserId.trim(),
    items: input.items.map((item) => ({
      productPoolItemId: item.productPoolItemId.trim(),
      quantity: item.quantity
    })),
    welfareCardPaymentAmount: input.welfareCardPaymentAmount,
    fulfillment: {
      type: input.fulfillment.type,
      receiverName: input.fulfillment.receiverName?.trim() ?? null,
      receiverPhone: input.fulfillment.receiverPhone?.trim() ?? null,
      receiverAddress: input.fulfillment.receiverAddress?.trim() ?? null,
      pickupStoreName: input.fulfillment.pickupStoreName?.trim() ?? null
    }
  };
}

function isSameCheckoutRequest(order: OrderCheckoutRecord, input: OrderCheckoutInput): boolean {
  return (
    order.buyerUserId === input.buyerUserId &&
    order.welfareCardPayableAmount === (input.welfareCardPaymentAmount ?? 0) &&
    isSameCheckoutItems(order, input) &&
    order.fulfillmentType === input.fulfillment.type &&
    order.receiverName === (input.fulfillment.receiverName ?? null) &&
    order.receiverPhone === (input.fulfillment.receiverPhone ?? null) &&
    order.receiverAddress === (input.fulfillment.receiverAddress ?? null) &&
    order.pickupStoreName === (input.fulfillment.pickupStoreName ?? null)
  );
}

function isSameCheckoutItems(order: OrderCheckoutRecord, input: OrderCheckoutInput): boolean {
  if (order.lines.length !== input.items.length) {
    return false;
  }

  return input.items.every((item, index) => {
    const line = order.lines[index];

    if (!line) {
      return false;
    }

    return line.productPoolItemId === item.productPoolItemId && line.quantity === item.quantity;
  });
}

function createOrderNo(): string {
  return `ORDER-${new Date().toISOString().replace(/[-:.TZ]/g, '')}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}
