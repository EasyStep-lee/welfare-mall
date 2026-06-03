import { BadRequestException } from '@nestjs/common';
import { splitOrderPaymentAmount } from '../../src/order/order-payment-split';

describe('splitOrderPaymentAmount', () => {
  it('splits total amount into welfare-card payable and cash payable amounts', () => {
    const result = splitOrderPaymentAmount({
      totalAmount: 13980,
      welfareCardPaymentAmount: 5000
    });

    expect(result).toEqual({
      welfareCardPayableAmount: 5000,
      cashPayableAmount: 8980
    });
  });

  it('defaults to cash-only payment when welfare-card amount is omitted', () => {
    const result = splitOrderPaymentAmount({
      totalAmount: 13980
    });

    expect(result).toEqual({
      welfareCardPayableAmount: 0,
      cashPayableAmount: 13980
    });
  });

  it('rejects welfare-card amount greater than total amount', () => {
    expect(() =>
      splitOrderPaymentAmount({
        totalAmount: 13980,
        welfareCardPaymentAmount: 14000
      })
    ).toThrow(BadRequestException);
  });
});
