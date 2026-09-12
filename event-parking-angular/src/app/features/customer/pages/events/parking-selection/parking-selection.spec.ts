import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { ParkingSelection } from './parking-selection';

describe('ParkingSelection', () => {
  let component: ParkingSelection;
  let fixture: ComponentFixture<ParkingSelection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParkingSelection],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ParkingSelection);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
