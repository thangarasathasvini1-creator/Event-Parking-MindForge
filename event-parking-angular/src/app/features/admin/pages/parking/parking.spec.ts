import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Parking } from './parking';

describe('Parking', () => {
  let component: Parking;
  let fixture: ComponentFixture<Parking>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Parking],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Parking);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
