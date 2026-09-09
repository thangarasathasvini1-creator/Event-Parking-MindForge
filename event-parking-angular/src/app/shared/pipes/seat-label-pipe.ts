import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'seatLabel',
})
export class SeatLabelPipe implements PipeTransform {
  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }
}
