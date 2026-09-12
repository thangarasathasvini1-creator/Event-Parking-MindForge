import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment.development';
import { Event } from '../models/event.model';

@Injectable({
  providedIn: 'root',
})
export class EventService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/api/events`;

  getEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(this.apiUrl);
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