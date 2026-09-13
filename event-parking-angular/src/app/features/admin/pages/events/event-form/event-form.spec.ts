import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { EventForm } from './event-form';

describe('EventForm', () => {
  let component: EventForm;
  let fixture: ComponentFixture<EventForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventForm],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(EventForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
