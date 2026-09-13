import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Seats } from './seats';

describe('Seats', () => {
  let component: Seats;
  let fixture: ComponentFixture<Seats>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Seats],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Seats);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
