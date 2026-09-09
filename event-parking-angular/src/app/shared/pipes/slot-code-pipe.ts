import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'slotCode',
})
export class SlotCodePipe implements PipeTransform {
  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }
}
