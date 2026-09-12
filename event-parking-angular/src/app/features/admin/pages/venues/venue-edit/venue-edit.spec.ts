import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { VenueEdit } from './venue-edit';

describe('VenueEdit', () => {
  let component: VenueEdit;
  let fixture: ComponentFixture<VenueEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VenueEdit],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(VenueEdit);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
