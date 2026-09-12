import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthStateService } from '../../../../core/auth/auth-state';
import { AuthStorageService } from '../../../../core/auth/auth-storage';

@Component({
  selector: 'app-login-callback',
  standalone: true,
  imports: [],
  templateUrl: './login-callback.html',
  styleUrl: './login-callback.css',
})
export class LoginCallback {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authState = inject(AuthStateService);
  private readonly authStorage = inject(AuthStorageService);

  constructor() {
    const params = this.route.snapshot.queryParamMap;

    const token = params.get('token');
    const customerId = params.get('customerId');
    const email = params.get('email');
    const name = params.get('name');
    const role = params.get('role');

    if (token && customerId && email && name && role) {
      this.authStorage.setToken(token);

      this.authState.setUser({
        customerId: Number(customerId),
        name,
        email,
        role,
      });

      const userRole = role.toLowerCase();
      if (userRole === 'admin' || userRole === 'administrator') {
        this.router.navigate(['/admin/events']);
      } else {
        this.router.navigate(['/customer/dashboard']);
      }

      return;
    }

    this.router.navigate(['/login']);
  }
}