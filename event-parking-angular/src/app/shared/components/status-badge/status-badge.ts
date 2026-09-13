import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.css',
})
export class StatusBadge {
  @Input() status = 'Active';

  get badgeClass(): string {
    const normalized = (this.status || '').trim().toLowerCase();
    switch (normalized) {
      case 'confirmed':
      case 'completed':
      case 'active':
      case 'paid':
      case 'available':
      case 'reserved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pending':
      case 'processing':
      case 'hold':
      case 'waiting':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'cancelled':
      case 'failed':
      case 'expired':
      case 'inactive':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  }
}

