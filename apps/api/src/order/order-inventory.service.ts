import { Injectable } from '@nestjs/common';
import {
  ListInventoryReservationsInput,
  ListInventoryReservationsResult,
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
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}
