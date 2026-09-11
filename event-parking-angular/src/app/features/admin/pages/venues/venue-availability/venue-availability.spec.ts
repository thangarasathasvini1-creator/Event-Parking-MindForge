import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VenueAvailability } from './venue-availability';

describe('VenueAvailability', () => {
  let component: VenueAvailability;
  let fixture: ComponentFixture<VenueAvailability>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VenueAvailability],
    }).compileComponents();

    fixture = TestBed.createComponent(VenueAvailability);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
