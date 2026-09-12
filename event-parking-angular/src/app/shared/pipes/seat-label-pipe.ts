import { Pipe, PipeTransform } from '@angular/core';
import { Seat } from '../../models/seat.model';

@Pipe({
  name: 'seatLabel',
  standalone: true
})
export class SeatLabelPipe implements PipeTransform {
  transform(seat: Seat): string {
    if (!seat) return '';
    
    // Parse row and column numbers if they are strings like "R10" and "C1"
    let rowNum = typeof seat.row === 'string' ? parseInt((seat.row as string).replace(/\D/g, ''), 10) : seat.row;
    let colNum = typeof seat.column === 'string' ? (seat.column as string).replace(/\D/g, '') : seat.column;

    if (isNaN(rowNum)) {
      return seat.seatNumber;
    }

    const rowLetter = String.fromCharCode(64 + rowNum);
    return `${rowLetter}-${colNum}`;
  }
}
