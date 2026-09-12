import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BookingStateService } from '../services/booking-state.service';

export const checkoutGuard: CanActivateFn = () => {
  const bookingState = inject(BookingStateService);
  const router = inject(Router);

  if (bookingState.event() && bookingState.selectedSeats().length > 0) {
    return true;
  }

  return router.createUrlTree(['/events']);
};
