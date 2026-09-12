import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ParkingService } from './parking';

describe('ParkingService', () => {
  let service: ParkingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });
    service = TestBed.inject(ParkingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
