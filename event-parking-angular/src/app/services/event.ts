import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Event } from '../models/event.model';

export interface EventFilterParams {
  name?: string;
  categoryId?: number;
  venueId?: number;
  eventDate?: string;
}

@Injectable({
  providedIn: 'root',
})
export class EventService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/events`;

  getEvents(filter?: EventFilterParams): Observable<Event[]> {
    let params = new HttpParams();

    if (filter) {
      if (filter.name && filter.name.trim()) {
        params = params.set('name', filter.name.trim());
      }
      if (filter.categoryId !== undefined && filter.categoryId !== null) {
        params = params.set('categoryId', filter.categoryId.toString());
      }
      if (filter.venueId !== undefined && filter.venueId !== null) {
        params = params.set('venueId', filter.venueId.toString());
      }
      if (filter.eventDate && filter.eventDate.trim()) {
        params = params.set('eventDate', filter.eventDate.trim());
      }
    }

    return this.http.get<Event[]>(this.apiUrl, { params });
  }

  getEventById(eventId: number): Observable<Event> {
    return this.http.get<Event>(`${this.apiUrl}/${eventId}`);
  }

  createEvent(event: Event): Observable<Event> {
  return this.http.post<Event>(this.apiUrl, event);
}

updateEvent(eventId: number, event: Event): Observable<Event> {
  return this.http.put<Event>(
    `${this.apiUrl}/${eventId}`,
    event
  );
}

deleteEvent(eventId: number): Observable<void> {
  return this.http.delete<void>(
    `${this.apiUrl}/${eventId}`
  );
}
}