import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { EventEdit } from './event-edit';

describe('EventEdit', () => {
  let component: EventEdit;
  let fixture: ComponentFixture<EventEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventEdit],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(EventEdit);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
