import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParkingSelection } from './parking-selection';

describe('ParkingSelection', () => {
  let component: ParkingSelection;
  let fixture: ComponentFixture<ParkingSelection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParkingSelection],
    }).compileComponents();

    fixture = TestBed.createComponent(ParkingSelection);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
