import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { SeatService } from './seat';

describe('SeatService', () => {
  let service: SeatService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });
    service = TestBed.inject(SeatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
