import { MerchantSettlementBillItem, MerchantSettlementStatement } from './api';

const settlementCsvHeaders = [
  'statementNo',
  'merchantId',
  'statementStatus',
  'itemCount',
  'statementGrossAmount',
  'statementRefundOffsetAmount',
  'statementAdjustmentAmount',
  'statementNetAmount',
  'generatedAt',
  'paidAt',
  'payoutReference',
  'payoutRemark',
  'billItemNo',
  'orderNo',
  'productId',
  'skuId',
  'billItemStatus',
  'billItemGrossAmount',
  'billItemRefundOffsetAmount',
  'billItemAdjustmentAmount',
  'billItemNetAmount'
];

export function buildSettlementCsv(statements: MerchantSettlementStatement[]): string {
  const rows = statements.flatMap((statement) => {
    const items = statement.items.length > 0 ? statement.items : [null];
    return items.map((item) => settlementCsvRow(statement, item));
  });

  return [settlementCsvHeaders, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
}

function settlementCsvRow(statement: MerchantSettlementStatement, item: MerchantSettlementBillItem | null) {
  return [
    statement.statementNo,
    statement.merchantId,
    statement.status,
    statement.itemCount,
    formatCents(statement.grossAmount),
    formatCents(statement.refundOffsetAmount),
    formatCents(statement.adjustmentAmount),
    formatCents(statement.netAmount),
    statement.generatedAt,
    statement.paidAt ?? '',
    statement.payoutReference ?? '',
    statement.payoutRemark ?? '',
    item?.billItemNo ?? '',
    item?.orderNo ?? '',
    item?.productId ?? '',
    item?.skuId ?? 'default',
    item?.status ?? '',
    item ? formatCents(item.grossAmount) : '',
    item ? formatCents(item.refundOffsetAmount) : '',
    item ? formatCents(item.adjustmentAmount) : '',
    item ? formatCents(item.netAmount) : ''
  ];
}

function formatCents(value: number): string {
  return (value / 100).toFixed(2);
}

function csvCell(value: string | number): string {
  const text = String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}
