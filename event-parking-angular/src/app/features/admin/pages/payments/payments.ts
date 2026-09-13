import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-payments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payments.html',
  styleUrl: './payments.css',
})
export class Payments {
  private readonly router = inject(Router);

  goToDashboard(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  goToBookings(): void {
    this.router.navigate(['/admin/bookings']);
  }
}