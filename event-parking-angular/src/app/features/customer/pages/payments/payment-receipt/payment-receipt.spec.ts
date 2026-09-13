import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { PaymentReceipt } from './payment-receipt';

describe('PaymentReceipt', () => {
  let component: PaymentReceipt;
  let fixture: ComponentFixture<PaymentReceipt>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentReceipt],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentReceipt);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

