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
    return (this.status || '').trim().toLowerCase() === 'available';
  }

  get isHeld(): boolean {
    return (this.status || '').trim().toLowerCase() === 'held';
  }

  get isVIP(): boolean {
    return (this.status || '').trim().toLowerCase() === 'vip';
  }

  get isBooked(): boolean {
    const s = (this.status || '').trim().toLowerCase();
    return s === 'booked' || s === 'occupied' || s === 'reserved';
  }

  get ariaLabel(): string {
    if (this.selected) {
      return `Seat ${this.seatNumber}, selected`;
    }
    if (this.isVIP) {
      return `Seat ${this.seatNumber}, VIP (Not bookable)`;
    }
    return `Seat ${this.seatNumber}, ${this.status.toLowerCase()}`;
  }

  onSeatClick(): void {
    if (!this.isAvailable) {
      return;
    }

    this.seatSelected.emit();
  }
}