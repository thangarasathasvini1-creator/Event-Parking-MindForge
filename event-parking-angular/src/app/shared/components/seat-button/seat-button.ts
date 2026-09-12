import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-seat-button',
  standalone: true,
  imports: [],
  templateUrl: './seat-button.html',
  styleUrl: './seat-button.css'
})
export class SeatButton {

  @Input() seatNumber = '';
  @Input() status = 'Available';
  @Input() selected = false;

  @Output() seatSelected = new EventEmitter<void>();

  get isAvailable(): boolean {
    return (this.status || '').toLowerCase() === 'available';
  }

  onSeatClick(): void {
    if (!this.isAvailable) {
      return;
    }

    this.seatSelected.emit();
  }
}