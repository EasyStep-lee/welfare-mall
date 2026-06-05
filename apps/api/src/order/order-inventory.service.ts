import { Injectable } from '@nestjs/common';
import {
  ListInventoryReservationsInput,
  ListInventoryReservationsResult,
  ListInventoryStocksInput,
  ListInventoryStocksResult,
  OrderInventoryRepository
} from './order-inventory.repository';

@Injectable()
export class OrderInventoryService {
  constructor(private readonly orderInventoryRepository: OrderInventoryRepository) {}

  async listReservations(input: ListInventoryReservationsInput = {}): Promise<ListInventoryReservationsResult> {
    return this.orderInventoryRepository.listReservations({
      status: normalizeOptionalText(input.status),
      merchantId: normalizeOptionalText(input.merchantId),
      orderNo: normalizeOptionalText(input.orderNo)
    });
  }

  async listStocks(input: ListInventoryStocksInput = {}): Promise<ListInventoryStocksResult> {
    return this.orderInventoryRepository.listStocks({
      merchantId: normalizeOptionalText(input.merchantId),
      productId: normalizeOptionalText(input.productId),
      skuId: normalizeOptionalText(input.skuId)
    });
  }
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}
