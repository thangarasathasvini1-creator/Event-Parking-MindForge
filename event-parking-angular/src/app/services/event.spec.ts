import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { EventService } from './event';

describe('EventService', () => {
  let service: EventService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });
    service = TestBed.inject(EventService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
