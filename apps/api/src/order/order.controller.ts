import { BadRequestException, Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { OrderAmountPreviewInput, OrderAmountService } from './order-amount.service';
import { OrderStatusCatalog } from './order-status';
import { OrderStatusTransitionCatalog } from './order-status-transition';

@ApiTags('orders')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderAmountService: OrderAmountService) {}

  @Get('statuses')
  @ApiOkResponse({
    description: 'Order status catalog',
    schema: { example: [{ code: 'pending_payment', name: '待支付', terminal: false }] }
  })
  getStatuses() {
    return OrderStatusCatalog;
  }

  @Get('status-transitions')
  @ApiOkResponse({
    description: 'Order status transition catalog',
    schema: {
      example: [
        {
          actor: 'user',
          fromStatus: 'draft',
          action: 'submit',
          toStatus: 'pending_payment',
          requiresReason: false
        }
      ]
    }
  })
  getStatusTransitions() {
    return OrderStatusTransitionCatalog;
  }

  @Post('amount-preview')
  @HttpCode(200)
  @ApiOkResponse({
    description: 'Preview order amount from product pool item snapshot prices',
    schema: {
      example: {
        lines: [
          {
            productPoolItemId: 'pool-item-001',
            productId: 'product-001',
            skuId: 'sku-001',
            displayName: '东北五常大米福利装',
            displaySkuCode: 'SKU-RICE-5KG',
            displayImageUrl: 'https://cdn.example.com/products/rice-main.jpg',
            unitPriceAmount: 6990,
            quantity: 2,
            lineTotalAmount: 13980
          }
        ],
        subtotalAmount: 13980,
        discountAmount: 0,
        totalAmount: 13980,
        welfareCardPayableAmount: 0,
        cashPayableAmount: 13980
      }
    }
  })
  async previewAmount(@Body() input: OrderAmountPreviewRequest) {
    assertOrderAmountPreviewRequest(input);

    return this.orderAmountService.previewAmount({
      items: input.items.map((item) => ({
        productPoolItemId: item.productPoolItemId.trim(),
        quantity: item.quantity
      })),
      welfareCardPaymentAmount: input.welfareCardPaymentAmount
    });
  }
}

type OrderAmountPreviewRequest = OrderAmountPreviewInput;

function assertOrderAmountPreviewRequest(input: OrderAmountPreviewRequest | undefined): asserts input is OrderAmountPreviewRequest {
  const messages: string[] = [];

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

  if (messages.length > 0) {
    throw new BadRequestException(messages);
  }
}
