import { AdminOrder } from './api';

export type AdminOrderSummary = {
  orderCount: number;
  lineQuantity: number;
  totalAmount: number;
  welfareCardPayableAmount: number;
  cashPayableAmount: number;
  pendingFulfillmentTasks: number;
  completedFulfillmentTasks: number;
};

export function summarizeAdminOrders(orders: AdminOrder[]): AdminOrderSummary {
  return orders.reduce<AdminOrderSummary>(
    (summary, order) => ({
      orderCount: summary.orderCount + 1,
      lineQuantity: summary.lineQuantity + order.lines.reduce((total, line) => total + line.quantity, 0),
      totalAmount: summary.totalAmount + order.totalAmount,
      welfareCardPayableAmount: summary.welfareCardPayableAmount + order.welfareCardPayableAmount,
      cashPayableAmount: summary.cashPayableAmount + order.cashPayableAmount,
      pendingFulfillmentTasks: summary.pendingFulfillmentTasks + order.fulfillmentSummary.pendingTasks,
      completedFulfillmentTasks: summary.completedFulfillmentTasks + order.fulfillmentSummary.completedTasks
    }),
    {
      orderCount: 0,
      lineQuantity: 0,
      totalAmount: 0,
      welfareCardPayableAmount: 0,
      cashPayableAmount: 0,
      pendingFulfillmentTasks: 0,
      completedFulfillmentTasks: 0
    }
  );
}
