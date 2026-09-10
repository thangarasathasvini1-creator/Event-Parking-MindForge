import { Injectable, signal, computed } from '@angular/core';

export interface AuthUser {
  customerId: number;
  name: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthStateService {
  private readonly userSignal = signal<AuthUser | null>(null);

  readonly user = this.userSignal.asReadonly();

  readonly isAuthenticated = computed(
    () => this.userSignal() !== null
  );

  readonly role = computed(
    () => this.userSignal()?.role ?? null
  );

  setUser(user: AuthUser): void {
    this.userSignal.set(user);
  }

  clearUser(): void {
    this.userSignal.set(null);
  }

  getUser(): AuthUser | null {
    return this.userSignal();
  }

  hasRole(role: string): boolean {
    return this.userSignal()?.role === role;
  }
}