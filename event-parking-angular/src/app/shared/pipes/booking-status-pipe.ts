import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'bookingStatus',
})
export class BookingStatusPipe implements PipeTransform {
  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }
}
