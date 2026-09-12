import { Injectable } from '@angular/core';

export interface StoredUser {
  customerId: number;
  name: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthStorageService {
  private readonly tokenKey = 'eventra_access_token';
  private readonly userKey = 'eventra_user';

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setUser(user: StoredUser): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  getUser(): StoredUser | null {
    const data = localStorage.getItem(this.userKey);
    if (!data) return null;
    try {
      return JSON.parse(data) as StoredUser;
    } catch {
      return null;
    }
  }

  removeToken(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  hasToken(): boolean {
    return this.getToken() !== null;
  }

  clear(): void {
    this.removeToken();
  }
}