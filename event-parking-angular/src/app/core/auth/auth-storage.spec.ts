import { TestBed } from '@angular/core/testing';
import { AuthStorage } from './auth-storage';

describe('AuthStorage', () => {
  let service: AuthStorage;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthStorage);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
