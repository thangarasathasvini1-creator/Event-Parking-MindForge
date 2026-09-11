import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VenueEdit } from './venue-edit';

describe('VenueEdit', () => {
  let component: VenueEdit;
  let fixture: ComponentFixture<VenueEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VenueEdit],
    }).compileComponents();

    fixture = TestBed.createComponent(VenueEdit);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
