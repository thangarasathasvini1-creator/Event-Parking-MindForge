import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'slotCode',
  standalone: true,
})
export class SlotCodePipe implements PipeTransform {
  transform(value: unknown): string {
    return typeof value === 'string' ? value.trim().toUpperCase() : '';
  }
}
