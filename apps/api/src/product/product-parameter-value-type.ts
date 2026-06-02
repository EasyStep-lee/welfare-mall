export const ProductParameterValueTypes = {
  Text: 'text',
  Number: 'number',
  Boolean: 'boolean',
  Date: 'date'
} as const;

export type ProductParameterValueType = (typeof ProductParameterValueTypes)[keyof typeof ProductParameterValueTypes];

export const ProductParameterValueTypeCatalog: Array<{ code: ProductParameterValueType; name: string }> = [
  { code: ProductParameterValueTypes.Text, name: '文本' },
  { code: ProductParameterValueTypes.Number, name: '数字' },
  { code: ProductParameterValueTypes.Boolean, name: '布尔' },
  { code: ProductParameterValueTypes.Date, name: '日期' }
];
