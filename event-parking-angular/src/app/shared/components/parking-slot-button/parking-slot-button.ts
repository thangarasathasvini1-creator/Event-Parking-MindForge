import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-parking-slot-button',
  standalone: true,
  imports: [],
  templateUrl: './parking-slot-button.html',
  styleUrl: './parking-slot-button.css',
})
export class ParkingSlotButton {
  @Input({ required: true }) slotNumber = '';
  @Input() zone = '';
  @Input() vehicleType = '';
  @Input() fee: number | null = null;
  @Input() status = 'Available';
  @Input() selected = false;

  @Output() slotSelected = new EventEmitter<void>();

  get isAvailable(): boolean {
    return (this.status || '').trim().toLowerCase() === 'available';
  }

  get isHeld(): boolean {
    return (this.status || '').trim().toLowerCase() === 'held';
  }

  get isOccupied(): boolean {
    const s = (this.status || '').trim().toLowerCase();
    return s === 'occupied' || s === 'booked' || s === 'reserved';
  }

  get ariaLabel(): string {
    const stateStr = this.selected ? 'selected' : (this.status || 'available').toLowerCase();
    return `Parking slot ${this.slotNumber}${this.zone ? ' zone ' + this.zone : ''}: ${stateStr}`;
  }

  onSlotClick(): void {
    if (this.isAvailable) {
      this.slotSelected.emit();
    }
  }
}

