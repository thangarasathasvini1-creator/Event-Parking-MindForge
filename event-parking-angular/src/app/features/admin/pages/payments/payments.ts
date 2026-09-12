import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-payments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payments.html',
  styleUrl: './payments.css',
})
export class Payments {

  payments: unknown[] = [];

  isLoading = false;
  errorMessage = '';

  loadPayments(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Admin payment listing API is not documented
    // in the current backend responsibility/API documents.
    //
    // Keep this page ready for the backend endpoint
    // instead of inventing an API.

    this.payments = [];
    this.isLoading = false;
  }

  refresh(): void {
    this.loadPayments();
  }
}