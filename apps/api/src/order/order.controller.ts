import { BadRequestException, Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { OrderAmountPreviewInput, OrderAmountService } from './order-amount.service';
import { OrderCheckoutInput, OrderCheckoutService } from './order-checkout.service';
import { OrderFulfillmentService } from './order-fulfillment.service';
import { CreateOrderPaymentInput, OrderPaymentService, ProcessOrderPaymentCallbackServiceInput } from './order-payment.service';
import { OrderReadService } from './order-read.service';
import { CreateOrderRefundInput, OrderRefundService, ProcessOrderRefundCallbackServiceInput } from './order-refund.service';
import { OrderStatusCatalog } from './order-status';
import { OrderStatusTransitionCatalog } from './order-status-transition';

@ApiTags('orders')
@Controller('orders')
export class OrderController {
  constructor(
    private readonly orderAmountService: OrderAmountService,
    private readonly orderCheckoutService: OrderCheckoutService,
    private readonly orderPaymentService: OrderPaymentService,
    private readonly orderRefundService: OrderRefundService,
    private readonly orderReadService: OrderReadService,
    private readonly orderFulfillmentService: OrderFulfillmentService
  ) {}

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

  @Get()
  @ApiOkResponse({
    description: 'List orders for one buyer',
    schema: {
      example: {
        orders: [
          {
            orderNo: 'ORDER-20260603-001',
            buyerUserId: 'user-001',
            status: 'pending_payment',
            totalAmount: 13980
          }
        ]
      }
    }
  })
  async listOrders(@Query('buyerUserId') buyerUserId: string) {
    assertRequiredText(buyerUserId, 'buyerUserId');

    return this.orderReadService.listOrders({ buyerUserId: buyerUserId.trim() });
  }

  @Get('merchant/fulfillment')
  @ApiOkResponse({
    description: 'List paid orders that contain products owned by one merchant',
    schema: {
      example: {
        orders: [
          {
            orderNo: 'ORDER-20260603-001',
            status: 'paid',
            totalAmount: 13980,
            receiverName: 'Li Lei',
            lines: [{ displayName: '东北五常大米福利装', quantity: 2 }]
          }
        ]
      }
    }
  })
  async listMerchantFulfillmentOrders(
    @Query('merchantId') merchantId: string,
    @Query('status') status?: string,
    @Query('orderNo') orderNo?: string,
    @Query('taskNo') taskNo?: string
  ) {
    assertRequiredText(merchantId, 'merchantId');

    return this.orderFulfillmentService.listMerchantFulfillmentOrders({
      merchantId: merchantId.trim(),
      status: status?.trim() || 'paid',
      orderNo: orderNo?.trim(),
      taskNo: taskNo?.trim()
    });
  }

  @Get('admin')
  @ApiOkResponse({
    description: 'List recent orders for Admin order management',
    schema: {
      example: {
        orders: [
          {
            orderNo: 'ORDER-20260603-001',
            buyerUserId: 'user-001',
            status: 'paid',
            totalAmount: 13980,
            latestPayment: { paymentNo: 'PAY-20260603-001', status: 'paid', channel: 'wechat' },
            lines: [{ displayName: '东北五常大米福利装', quantity: 2 }]
          }
        ]
      }
    }
  })
  async listAdminOrders(
    @Query('status') status?: string,
    @Query('fulfillmentStatus') fulfillmentStatus?: string,
    @Query('merchantId') merchantId?: string,
    @Query('taskNo') taskNo?: string
  ) {
    return this.orderReadService.listAdminOrders({
      status: status?.trim(),
      fulfillmentStatus: fulfillmentStatus?.trim(),
      merchantId: merchantId?.trim(),
      taskNo: taskNo?.trim()
    });
  }

  @Post('merchant/fulfillment/:orderNo/complete')
  @HttpCode(200)
  @ApiOkResponse({
    description: 'Complete one paid merchant fulfillment order',
    schema: {
      example: {
        order: {
          orderNo: 'ORDER-20260603-001',
          status: 'completed',
          lines: [{ displayName: '东北五常大米福利装', quantity: 2 }]
        }
      }
    }
  })
  async completeMerchantFulfillmentOrder(@Param('orderNo') orderNo: string, @Body() input: CompleteMerchantFulfillmentOrderRequest) {
    assertRequiredText(orderNo, 'orderNo');
    assertRequiredText(input?.merchantId, 'merchantId');

    const pickupCode = input.pickupCode?.trim();

    return this.orderFulfillmentService.completeMerchantFulfillmentOrder({
      orderNo: orderNo.trim(),
      merchantId: input.merchantId.trim(),
      ...(pickupCode ? { pickupCode } : {})
    });
  }

  @Get(':orderNo')
  @ApiOkResponse({
    description: 'Get one buyer-scoped order detail',
    schema: {
      example: {
        order: {
          orderNo: 'ORDER-20260603-001',
          buyerUserId: 'user-001',
          status: 'pending_payment',
          totalAmount: 13980,
          lines: [{ displayName: '东北五常大米福利装', quantity: 2 }]
        }
      }
    }
  })
  async getOrderDetail(@Param('orderNo') orderNo: string, @Query('buyerUserId') buyerUserId: string) {
    assertRequiredText(orderNo, 'orderNo');
    assertRequiredText(buyerUserId, 'buyerUserId');

    return this.orderReadService.getOrderDetail({
      orderNo: orderNo.trim(),
      buyerUserId: buyerUserId.trim()
    });
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

  @Post()
  @HttpCode(201)
  @ApiCreatedResponse({
    description: 'Create an order from product-pool checkout snapshot lines',
    schema: {
      example: {
        idempotentReplay: false,
        order: {
          orderNo: 'ORDER-20260603-001',
          requestId: 'checkout-request-001',
          buyerUserId: 'user-001',
          status: 'pending_payment',
          totalAmount: 13980,
          welfareCardPayableAmount: 5000,
          cashPayableAmount: 8980
        }
      }
    }
  })
  async createOrder(@Body() input: OrderCheckoutRequest) {
    assertOrderCheckoutRequest(input);

    return this.orderCheckoutService.createOrder({
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
    });
  }

  @Post('payments')
  @HttpCode(201)
  @ApiCreatedResponse({
    description: 'Create an idempotent order payment',
    schema: {
      example: {
        idempotentReplay: false,
        payment: {
          paymentNo: 'PAY-20260603-001',
          requestId: 'request-001',
          orderNo: 'ORDER-20260603-001',
          status: 'pending',
          channel: 'wechat',
          totalAmount: 13980,
          welfareCardPayableAmount: 5000,
          cashPayableAmount: 8980
        }
      }
    }
  })
  async createPayment(@Body() input: CreateOrderPaymentRequest) {
    assertCreateOrderPaymentRequest(input);

    return this.orderPaymentService.createPayment({
      requestId: input.requestId.trim(),
      orderNo: input.orderNo.trim(),
      channel: input.channel,
      totalAmount: input.totalAmount,
      welfareCardPayableAmount: input.welfareCardPayableAmount,
      cashPayableAmount: input.cashPayableAmount
    });
  }

  @Post('payments/callbacks')
  @HttpCode(200)
  @ApiOkResponse({
    description: 'Process an idempotent payment provider callback',
    schema: {
      example: {
        duplicate: false,
        payment: {
          paymentNo: 'PAY-20260603-001',
          status: 'paid',
          providerPaymentNo: 'wx-pay-001'
        },
        callback: {
          providerEventId: 'event-001',
          status: 'paid'
        }
      }
    }
  })
  async processPaymentCallback(@Body() input: ProcessOrderPaymentCallbackRequest) {
    assertProcessOrderPaymentCallbackRequest(input);

    return this.orderPaymentService.processCallback({
      providerEventId: input.providerEventId.trim(),
      paymentNo: input.paymentNo.trim(),
      providerPaymentNo: input.providerPaymentNo.trim(),
      status: input.status,
      paidAt: normalizeCallbackPaidAt(input.paidAt),
      payload: input.payload ?? {}
    });
  }

  @Post('refunds')
  @HttpCode(201)
  @ApiCreatedResponse({
    description: 'Create an idempotent order refund',
    schema: {
      example: {
        idempotentReplay: false,
        refund: {
          refundNo: 'REF-20260603-001',
          requestId: 'refund-request-001',
          paymentNo: 'PAY-20260603-001',
          orderNo: 'ORDER-20260603-001',
          status: 'processing',
          channel: 'wechat',
          refundAmount: 5000,
          reason: 'user_cancel'
        }
      }
    }
  })
  async createRefund(@Body() input: CreateOrderRefundRequest) {
    assertCreateOrderRefundRequest(input);

    return this.orderRefundService.createRefund({
      requestId: input.requestId.trim(),
      paymentNo: input.paymentNo.trim(),
      orderNo: input.orderNo.trim(),
      channel: input.channel,
      refundAmount: input.refundAmount,
      reason: input.reason
    });
  }

  @Post('refunds/callbacks')
  @HttpCode(200)
  @ApiOkResponse({
    description: 'Process an idempotent refund provider callback',
    schema: {
      example: {
        duplicate: false,
        refund: {
          refundNo: 'REF-20260603-001',
          status: 'succeeded',
          providerRefundNo: 'wx-refund-001'
        },
        callback: {
          providerEventId: 'refund-event-001',
          status: 'succeeded'
        }
      }
    }
  })
  async processRefundCallback(@Body() input: ProcessOrderRefundCallbackRequest) {
    assertProcessOrderRefundCallbackRequest(input);

    return this.orderRefundService.processCallback({
      providerEventId: input.providerEventId.trim(),
      refundNo: input.refundNo.trim(),
      providerRefundNo: input.providerRefundNo.trim(),
      status: input.status,
      succeededAt: normalizeCallbackSucceededAt(input.succeededAt),
      payload: input.payload ?? {}
    });
  }
}

type OrderAmountPreviewRequest = OrderAmountPreviewInput;
type OrderCheckoutRequest = OrderCheckoutInput;
type CompleteMerchantFulfillmentOrderRequest = {
  merchantId: string;
  pickupCode?: string;
};
type CreateOrderPaymentRequest = CreateOrderPaymentInput;
type ProcessOrderPaymentCallbackRequest = Omit<ProcessOrderPaymentCallbackServiceInput, 'paidAt'> & {
  paidAt?: string | Date | null;
};
type CreateOrderRefundRequest = CreateOrderRefundInput;
type ProcessOrderRefundCallbackRequest = Omit<ProcessOrderRefundCallbackServiceInput, 'succeededAt'> & {
  succeededAt?: string | Date | null;
};

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

function assertOrderCheckoutRequest(input: OrderCheckoutRequest | undefined): asserts input is OrderCheckoutRequest {
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

function assertCreateOrderPaymentRequest(input: CreateOrderPaymentRequest | undefined): asserts input is CreateOrderPaymentRequest {
  const messages: string[] = [];
  const totalAmount = input?.totalAmount;
  const welfareCardPayableAmount = input?.welfareCardPayableAmount;
  const cashPayableAmount = input?.cashPayableAmount;

  if (typeof input?.requestId !== 'string' || input.requestId.trim().length === 0) {
    messages.push('requestId is required.');
  }

  if (typeof input?.orderNo !== 'string' || input.orderNo.trim().length === 0) {
    messages.push('orderNo is required.');
  }

  if (!['wechat', 'alipay', 'cash'].includes(input?.channel ?? '')) {
    messages.push('channel must be one of wechat, alipay, cash.');
  }

  if (!Number.isInteger(totalAmount) || (totalAmount ?? 0) <= 0) {
    messages.push('totalAmount must be a positive integer.');
  }

  if (!Number.isInteger(welfareCardPayableAmount) || (welfareCardPayableAmount ?? -1) < 0) {
    messages.push('welfareCardPayableAmount must be a non-negative integer.');
  }

  if (!Number.isInteger(cashPayableAmount) || (cashPayableAmount ?? -1) < 0) {
    messages.push('cashPayableAmount must be a non-negative integer.');
  }

  if (
    Number.isInteger(totalAmount) &&
    Number.isInteger(welfareCardPayableAmount) &&
    Number.isInteger(cashPayableAmount) &&
    welfareCardPayableAmount! + cashPayableAmount! !== totalAmount
  ) {
    messages.push('welfareCardPayableAmount plus cashPayableAmount must equal totalAmount.');
  }

  if (messages.length > 0) {
    throw new BadRequestException(messages);
  }
}

function assertRequiredText(value: string | undefined, fieldName: string): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new BadRequestException(`${fieldName} is required.`);
  }
}

function assertProcessOrderPaymentCallbackRequest(
  input: ProcessOrderPaymentCallbackRequest | undefined
): asserts input is ProcessOrderPaymentCallbackRequest {
  const messages: string[] = [];

  if (typeof input?.providerEventId !== 'string' || input.providerEventId.trim().length === 0) {
    messages.push('providerEventId is required.');
  }

  if (typeof input?.paymentNo !== 'string' || input.paymentNo.trim().length === 0) {
    messages.push('paymentNo is required.');
  }

  if (typeof input?.providerPaymentNo !== 'string' || input.providerPaymentNo.trim().length === 0) {
    messages.push('providerPaymentNo is required.');
  }

  if (!['paid', 'failed'].includes(input?.status ?? '')) {
    messages.push('status must be paid or failed.');
  }

  if (input?.status === 'paid' && !isValidDateInput(input.paidAt)) {
    messages.push('paidAt is required for paid callbacks.');
  }

  if (messages.length > 0) {
    throw new BadRequestException(messages);
  }
}

function assertCreateOrderRefundRequest(input: CreateOrderRefundRequest | undefined): asserts input is CreateOrderRefundRequest {
  const messages: string[] = [];
  const refundAmount = input?.refundAmount;

  if (typeof input?.requestId !== 'string' || input.requestId.trim().length === 0) {
    messages.push('requestId is required.');
  }

  if (typeof input?.paymentNo !== 'string' || input.paymentNo.trim().length === 0) {
    messages.push('paymentNo is required.');
  }

  if (typeof input?.orderNo !== 'string' || input.orderNo.trim().length === 0) {
    messages.push('orderNo is required.');
  }

  if (!['wechat', 'alipay', 'cash'].includes(input?.channel ?? '')) {
    messages.push('channel must be one of wechat, alipay, cash.');
  }

  if (!Number.isInteger(refundAmount) || (refundAmount ?? 0) <= 0) {
    messages.push('refundAmount must be a positive integer.');
  }

  if (!['user_cancel', 'merchant_out_of_stock', 'after_sale'].includes(input?.reason ?? '')) {
    messages.push('reason must be one of user_cancel, merchant_out_of_stock, after_sale.');
  }

  if (messages.length > 0) {
    throw new BadRequestException(messages);
  }
}

function assertProcessOrderRefundCallbackRequest(
  input: ProcessOrderRefundCallbackRequest | undefined
): asserts input is ProcessOrderRefundCallbackRequest {
  const messages: string[] = [];

  if (typeof input?.providerEventId !== 'string' || input.providerEventId.trim().length === 0) {
    messages.push('providerEventId is required.');
  }

  if (typeof input?.refundNo !== 'string' || input.refundNo.trim().length === 0) {
    messages.push('refundNo is required.');
  }

  if (typeof input?.providerRefundNo !== 'string' || input.providerRefundNo.trim().length === 0) {
    messages.push('providerRefundNo is required.');
  }

  if (!['succeeded', 'failed'].includes(input?.status ?? '')) {
    messages.push('status must be succeeded or failed.');
  }

  if (input?.status === 'succeeded' && !isValidDateInput(input.succeededAt)) {
    messages.push('succeededAt is required for succeeded callbacks.');
  }

  if (messages.length > 0) {
    throw new BadRequestException(messages);
  }
}

function normalizeCallbackPaidAt(value: string | Date | null | undefined): Date | null {
  if (value === null || value === undefined) {
    return null;
  }

  return value instanceof Date ? value : new Date(value);
}

function normalizeCallbackSucceededAt(value: string | Date | null | undefined): Date | null {
  if (value === null || value === undefined) {
    return null;
  }

  return value instanceof Date ? value : new Date(value);
}

function isValidDateInput(value: string | Date | null | undefined): boolean {
  if (value instanceof Date) {
    return !Number.isNaN(value.getTime());
  }

  if (typeof value !== 'string' || value.trim().length === 0) {
    return false;
  }

  return !Number.isNaN(new Date(value).getTime());
}
