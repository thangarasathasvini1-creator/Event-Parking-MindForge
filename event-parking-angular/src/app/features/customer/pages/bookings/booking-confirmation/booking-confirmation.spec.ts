import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { BookingConfirmation } from './booking-confirmation';

describe('BookingConfirmation', () => {
  let component: BookingConfirmation;
  let fixture: ComponentFixture<BookingConfirmation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingConfirmation],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(BookingConfirmation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
