import { Pipe, PipeTransform } from '@angular/core';

import { Payment } from '../../models/payment.model';

@Pipe({
  name: 'sumAmount',
  standalone: true
})
export class SumAmountPipe implements PipeTransform {

  transform(payments: Payment[]): number {

    if (!payments || payments.length === 0) {
      return 0;
    }

    return payments.reduce(
      (total, payment) => total + (payment.amount ?? 0),
      0
    );
  }

}