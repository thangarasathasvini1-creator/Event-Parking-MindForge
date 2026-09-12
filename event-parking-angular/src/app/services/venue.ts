import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Venue } from '../models/venue.model';

@Injectable({
  providedIn: 'root',
})
export class VenueService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/venues`;

  getVenues(): Observable<Venue[]> {
    return this.http.get<Venue[]>(this.apiUrl);
  }

  getVenueById(venueId: number): Observable<Venue> {
    return this.http.get<Venue>(`${this.apiUrl}/${venueId}`);
  }

  getAvailableVenues(
  eventDate: string,
  startTime: string,
  endTime: string
): Observable<Venue[]> {
  return this.http.get<Venue[]>(
    `${this.apiUrl}/available`,
    {
      params: {
        eventDate,
        startTime,
        endTime,
      },
    }
  );
}

createVenue(venue: Venue): Observable<Venue> {
  return this.http.post<Venue>(this.apiUrl, venue);
}

updateVenue(venueId: number, venue: Venue): Observable<Venue> {
  return this.http.put<Venue>(
    `${this.apiUrl}/${venueId}`,
    venue
  );
}

deleteVenue(venueId: number): Observable<void> {
  return this.http.delete<void>(
    `${this.apiUrl}/${venueId}`
  );
}

}