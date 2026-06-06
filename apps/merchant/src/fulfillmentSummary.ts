import { MerchantFulfillmentOrder } from './api';

export type MerchantFulfillmentSummary = {
  taskCount: number;
  lineQuantity: number;
  totalAmount: number;
  welfareCardPayableAmount: number;
  cashPayableAmount: number;
  deliveryTasks: number;
  pickupTasks: number;
};

export function summarizeMerchantFulfillmentOrders(orders: MerchantFulfillmentOrder[]): MerchantFulfillmentSummary {
  return orders.reduce<MerchantFulfillmentSummary>(
    (summary, order) => ({
      taskCount: summary.taskCount + 1,
      lineQuantity: summary.lineQuantity + order.lines.reduce((total, line) => total + line.quantity, 0),
      totalAmount: summary.totalAmount + order.totalAmount,
      welfareCardPayableAmount: summary.welfareCardPayableAmount + order.welfareCardPayableAmount,
      cashPayableAmount: summary.cashPayableAmount + order.cashPayableAmount,
      deliveryTasks: summary.deliveryTasks + (order.fulfillmentType === 'delivery' ? 1 : 0),
      pickupTasks: summary.pickupTasks + (order.fulfillmentType === 'pickup' ? 1 : 0)
    }),
    {
      taskCount: 0,
      lineQuantity: 0,
      totalAmount: 0,
      welfareCardPayableAmount: 0,
      cashPayableAmount: 0,
      deliveryTasks: 0,
      pickupTasks: 0
    }
  );
}
