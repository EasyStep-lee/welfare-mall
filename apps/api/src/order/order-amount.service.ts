import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderAmountRepository } from './order-amount.repository';
import { splitOrderPaymentAmount } from './order-payment-split';

export type OrderAmountPreviewInput = {
  items: Array<{
    productPoolItemId: string;
    quantity: number;
  }>;
  welfareCardPaymentAmount?: number;
};

export type OrderAmountPreviewLine = {
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

export type OrderAmountPreviewResult = {
  lines: OrderAmountPreviewLine[];
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  welfareCardPayableAmount: number;
  cashPayableAmount: number;
};

@Injectable()
export class OrderAmountService {
  constructor(private readonly orderAmountRepository: OrderAmountRepository) {}

  async previewAmount(input: OrderAmountPreviewInput): Promise<OrderAmountPreviewResult> {
    assertPreviewInput(input);

    const normalizedItems = input.items.map((item) => ({
      productPoolItemId: item.productPoolItemId.trim(),
      quantity: item.quantity
    }));
    const productPoolItems = await this.orderAmountRepository.listAmountItemsByIds(
      normalizedItems.map((item) => item.productPoolItemId)
    );
    const itemById = new Map(productPoolItems.map((item) => [item.id, item]));
    const lines: OrderAmountPreviewLine[] = normalizedItems.map((inputItem) => {
      const productPoolItem = itemById.get(inputItem.productPoolItemId);

      if (!productPoolItem) {
        throw new NotFoundException(`Product pool item ${inputItem.productPoolItemId} not found.`);
      }

      return {
        productPoolItemId: productPoolItem.id,
        productId: productPoolItem.productId,
        skuId: productPoolItem.skuId,
        displayName: productPoolItem.displayName,
        displaySkuCode: productPoolItem.displaySkuCode,
        displayImageUrl: productPoolItem.displayImageUrl,
        unitPriceAmount: productPoolItem.displayPriceAmount,
        quantity: inputItem.quantity,
        lineTotalAmount: productPoolItem.displayPriceAmount * inputItem.quantity
      };
    });
    const subtotalAmount = lines.reduce((sum, line) => sum + line.lineTotalAmount, 0);
    const discountAmount = 0;
    const totalAmount = subtotalAmount - discountAmount;
    const paymentSplit = splitOrderPaymentAmount({
      totalAmount,
      welfareCardPaymentAmount: input.welfareCardPaymentAmount
    });

    return {
      lines,
      subtotalAmount,
      discountAmount,
      totalAmount,
      welfareCardPayableAmount: paymentSplit.welfareCardPayableAmount,
      cashPayableAmount: paymentSplit.cashPayableAmount
    };
  }
}

function assertPreviewInput(input: OrderAmountPreviewInput): void {
  const messages: string[] = [];

  if (!Array.isArray(input.items) || input.items.length === 0) {
    messages.push('items must contain at least one product pool item.');
  }

  for (const [index, item] of (input.items ?? []).entries()) {
    if (typeof item?.productPoolItemId !== 'string' || item.productPoolItemId.trim().length === 0) {
      messages.push(`items[${index}].productPoolItemId is required.`);
    }

    if (!Number.isInteger(item?.quantity) || item.quantity <= 0) {
      messages.push(`items[${index}].quantity must be a positive integer.`);
    }
  }

  if (
    input.welfareCardPaymentAmount !== undefined &&
    (!Number.isInteger(input.welfareCardPaymentAmount) || input.welfareCardPaymentAmount < 0)
  ) {
    messages.push('welfareCardPaymentAmount must be a non-negative integer.');
  }

  if (messages.length > 0) {
    throw new BadRequestException(messages);
  }
}
