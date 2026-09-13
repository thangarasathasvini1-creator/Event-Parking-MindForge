import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  styleUrl: './stat-card.css',
  templateUrl: './stat-card.html',
})
export class StatCard {
  @Input() title = '';
  @Input() value: string | number = 0;
  @Input() description = '';
  @Input() icon = '';
  @Input() trend = '';
  @Input() colorScheme: 'blue' | 'emerald' | 'amber' | 'purple' | 'slate' | 'rose' = 'blue';

  get iconBgClass(): string {
    switch (this.colorScheme) {
      case 'emerald':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'amber':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'purple':
        return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'rose':
        return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'slate':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'blue':
      default:
        return 'bg-blue-50 text-blue-600 border-blue-100';
    }
  }

  get valueColorClass(): string {
    switch (this.colorScheme) {
      case 'emerald':
        return 'text-emerald-600';
      case 'amber':
        return 'text-amber-600';
      case 'purple':
        return 'text-purple-600';
      case 'rose':
        return 'text-rose-600';
      case 'slate':
        return 'text-slate-800';
      case 'blue':
      default:
        return 'text-slate-950';
    }
  }
}
