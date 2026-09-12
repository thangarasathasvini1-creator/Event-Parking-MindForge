import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeatButton } from './seat-button';

describe('SeatButton', () => {
  let component: SeatButton;
  let fixture: ComponentFixture<SeatButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeatButton],
    }).compileComponents();

    fixture = TestBed.createComponent(SeatButton);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
