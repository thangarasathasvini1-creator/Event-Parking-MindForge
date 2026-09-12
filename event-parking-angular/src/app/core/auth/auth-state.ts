import { Injectable, signal, computed, inject } from '@angular/core';
import { AuthStorageService } from './auth-storage';

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
  private readonly authStorage = inject(AuthStorageService);

  private readonly userSignal = signal<AuthUser | null>(
    this.authStorage.getUser()
  );

  readonly user = this.userSignal.asReadonly();

  readonly isAuthenticated = computed(
    () => this.userSignal() !== null && this.authStorage.hasToken()
  );

  readonly role = computed(
    () => this.userSignal()?.role ?? null
  );

  setUser(user: AuthUser): void {
    this.userSignal.set(user);
    this.authStorage.setUser(user);
  }

  clearUser(): void {
    this.userSignal.set(null);
    this.authStorage.clear();
  }

  getUser(): AuthUser | null {
    return this.userSignal() ?? this.authStorage.getUser();
  }

  hasRole(role: string): boolean {
    const userRole = (this.getUser()?.role ?? '').toLowerCase();
    const target = role.toLowerCase();
    if (target === 'admin' || target === 'administrator') {
      return userRole === 'admin' || userRole === 'administrator';
    }
    return userRole === target;
  }
}