import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParkingSlotButton } from './parking-slot-button';

describe('ParkingSlotButton', () => {
  let component: ParkingSlotButton;
  let fixture: ComponentFixture<ParkingSlotButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParkingSlotButton],
    }).compileComponents();

    fixture = TestBed.createComponent(ParkingSlotButton);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
