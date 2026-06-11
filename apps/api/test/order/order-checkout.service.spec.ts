import { BadRequestException, ConflictException } from '@nestjs/common';
import { OrderAmountService } from '../../src/order/order-amount.service';
import { InsufficientInventoryError, OrderCheckoutRepository } from '../../src/order/order-checkout.repository';
import { OrderCheckoutService } from '../../src/order/order-checkout.service';

const checkoutInput = {
  requestId: 'checkout-request-001',
  buyerUserId: 'user-001',
  items: [{ productPoolItemId: 'pool-item-001', quantity: 2 }],
  welfareCardPaymentAmount: 5000,
  fulfillment: {
    type: 'delivery' as const,
    receiverName: '李雷',
    receiverPhone: '13800000000',
    receiverAddress: '上海市浦东新区世纪大道 1 号'
  }
};

const orderRecord = {
  id: 'order-001',
  orderNo: 'ORDER-20260603-001',
  requestId: 'checkout-request-001',
  buyerUserId: 'user-001',
  status: 'pending_payment',
  subtotalAmount: 13980,
  discountAmount: 0,
  totalAmount: 13980,
  welfareCardPayableAmount: 5000,
  cashPayableAmount: 8980,
  fulfillmentType: 'delivery',
  receiverName: '李雷',
  receiverPhone: '13800000000',
  receiverAddress: '上海市浦东新区世纪大道 1 号',
  pickupStoreName: null,
  createdAt: new Date('2026-06-03T00:00:00.000Z'),
  updatedAt: new Date('2026-06-03T00:00:00.000Z'),
  lines: [
    {
      id: 'order-line-001',
      orderId: 'order-001',
      productPoolItemId: 'pool-item-001',
      productId: 'product-001',
      skuId: 'sku-001',
      displayName: '东北五常大米福利装',
      displaySkuCode: 'SKU-RICE-5KG',
      displayImageUrl: 'https://cdn.example.com/products/rice-main.jpg',
      unitPriceAmount: 6990,
      quantity: 2,
      lineTotalAmount: 13980,
      createdAt: new Date('2026-06-03T00:00:00.000Z')
    }
  ]
};

function createAmountServiceMock() {
  return {
    previewAmount: jest.fn().mockResolvedValue({
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
      welfareCardPayableAmount: 5000,
      cashPayableAmount: 8980
    })
  };
}

function createRepositoryMock() {
  return {
    findOrderByRequestId: jest.fn().mockResolvedValue(null),
    createOrder: jest.fn().mockResolvedValue(orderRecord)
  };
}

describe('OrderCheckoutService', () => {
  it('creates an order from amount preview snapshot lines', async () => {
    const amountService = createAmountServiceMock();
    const repository = createRepositoryMock();
    const service = new OrderCheckoutService(
      amountService as unknown as OrderAmountService,
      repository as unknown as OrderCheckoutRepository
    );

    const result = await service.createOrder(checkoutInput);

    expect(amountService.previewAmount).toHaveBeenCalledWith({
      items: [{ productPoolItemId: 'pool-item-001', quantity: 2 }],
      welfareCardPaymentAmount: 5000
    });
    expect(repository.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'checkout-request-001',
        buyerUserId: 'user-001',
        status: 'pending_payment',
        subtotalAmount: 13980,
        totalAmount: 13980,
        welfareCardPayableAmount: 5000,
        cashPayableAmount: 8980,
        fulfillmentType: 'delivery',
        receiverName: '李雷',
        receiverPhone: '13800000000',
        receiverAddress: '上海市浦东新区世纪大道 1 号',
        pickupStoreName: null,
        lines: [
          expect.objectContaining({
            productPoolItemId: 'pool-item-001',
            displayName: '东北五常大米福利装',
            unitPriceAmount: 6990,
            quantity: 2,
            lineTotalAmount: 13980
          })
        ]
      })
    );
    expect(result).toEqual({ idempotentReplay: false, order: orderRecord });
  });

  it('creates a pickup order without legacy pickup-store input', async () => {
    const amountService = createAmountServiceMock();
    const repository = createRepositoryMock();
    const service = new OrderCheckoutService(
      amountService as unknown as OrderAmountService,
      repository as unknown as OrderCheckoutRepository
    );

    await service.createOrder({
      ...checkoutInput,
      requestId: 'checkout-request-pickup-001',
      welfareCardPaymentAmount: undefined,
      fulfillment: {
        type: 'pickup'
      }
    });

    expect(amountService.previewAmount).toHaveBeenCalledWith({
      items: [{ productPoolItemId: 'pool-item-001', quantity: 2 }],
      welfareCardPaymentAmount: undefined
    });
    expect(repository.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'checkout-request-pickup-001',
        buyerUserId: 'user-001',
        welfareCardPayableAmount: 5000,
        cashPayableAmount: 8980,
        fulfillmentType: 'pickup',
        receiverName: null,
        receiverPhone: null,
        receiverAddress: null,
        pickupStoreName: null
      })
    );
  });

  it('returns an existing order for the same idempotent checkout request', async () => {
    const amountService = createAmountServiceMock();
    const repository = createRepositoryMock();
    repository.findOrderByRequestId.mockResolvedValue(orderRecord);
    const service = new OrderCheckoutService(
      amountService as unknown as OrderAmountService,
      repository as unknown as OrderCheckoutRepository
    );

    const result = await service.createOrder(checkoutInput);

    expect(repository.createOrder).not.toHaveBeenCalled();
    expect(result).toEqual({ idempotentReplay: true, order: orderRecord });
  });

  it('rejects a reused request ID with a different buyer', async () => {
    const amountService = createAmountServiceMock();
    const repository = createRepositoryMock();
    repository.findOrderByRequestId.mockResolvedValue(orderRecord);
    const service = new OrderCheckoutService(
      amountService as unknown as OrderAmountService,
      repository as unknown as OrderCheckoutRepository
    );

    await expect(service.createOrder({ ...checkoutInput, buyerUserId: 'user-002' })).rejects.toBeInstanceOf(
      ConflictException
    );
  });

  it('rejects a reused request ID with different checkout items or payment amount', async () => {
    const amountService = createAmountServiceMock();
    const repository = createRepositoryMock();
    repository.findOrderByRequestId.mockResolvedValue(orderRecord);
    const service = new OrderCheckoutService(
      amountService as unknown as OrderAmountService,
      repository as unknown as OrderCheckoutRepository
    );

    await expect(
      service.createOrder({
        ...checkoutInput,
        items: [{ productPoolItemId: 'pool-item-001', quantity: 1 }],
        welfareCardPaymentAmount: 1000
      })
    ).rejects.toBeInstanceOf(ConflictException);

    expect(amountService.previewAmount).not.toHaveBeenCalled();
    expect(repository.createOrder).not.toHaveBeenCalled();
  });

  it('rejects missing delivery receiver fields before amount preview', async () => {
    const amountService = createAmountServiceMock();
    const repository = createRepositoryMock();
    const service = new OrderCheckoutService(
      amountService as unknown as OrderAmountService,
      repository as unknown as OrderCheckoutRepository
    );

    await expect(
      service.createOrder({
        ...checkoutInput,
        fulfillment: { ...checkoutInput.fulfillment, receiverPhone: ' ' }
      })
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(amountService.previewAmount).not.toHaveBeenCalled();
  });

  it('maps insufficient stock reservation to a checkout conflict', async () => {
    const amountService = createAmountServiceMock();
    const repository = createRepositoryMock();
    repository.createOrder.mockRejectedValue(
      new InsufficientInventoryError({ productId: 'product-001', skuId: 'sku-001', requestedQuantity: 2 })
    );
    const service = new OrderCheckoutService(
      amountService as unknown as OrderAmountService,
      repository as unknown as OrderCheckoutRepository
    );

    await expect(service.createOrder(checkoutInput)).rejects.toBeInstanceOf(ConflictException);
    await expect(service.createOrder(checkoutInput)).rejects.toThrow('insufficient inventory');
  });
});
