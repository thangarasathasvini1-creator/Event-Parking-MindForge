import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerifyPasswordResetOtp } from './verify-password-reset-otp';

describe('VerifyPasswordResetOtp', () => {
  let component: VerifyPasswordResetOtp;
  let fixture: ComponentFixture<VerifyPasswordResetOtp>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerifyPasswordResetOtp],
    }).compileComponents();

    fixture = TestBed.createComponent(VerifyPasswordResetOtp);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
