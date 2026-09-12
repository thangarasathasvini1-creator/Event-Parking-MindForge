import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { Bookings } from './bookings';

describe('Bookings', () => {
  let component: Bookings;
  let fixture: ComponentFixture<Bookings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Bookings],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Bookings);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
