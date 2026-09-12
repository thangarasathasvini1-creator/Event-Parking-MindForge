import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-parking-slot-button',
  templateUrl: './parking-slot-button.html',
  styleUrl: './parking-slot-button.css',
})
export class ParkingSlotButton {
  @Input({ required: true }) slotNumber = '';
  @Input() status = 'Available';
  @Input() selected = false;

  @Output() slotSelected = new EventEmitter<void>();

  get isAvailable(): boolean {
    return this.status.toLowerCase() === 'available';
  }

  onSlotClick(): void {
    if (this.isAvailable) {
      this.slotSelected.emit();
    }
  }
}
