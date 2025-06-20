import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface ScanSection {
  imageUrl: string;
  userPrediction: string;
  correctOrgan: string;
  isCorrect: boolean;
}

export interface ScanResult {
  _id?: string;
  user?: string;
  scanSections: ScanSection[];
  totalScans: number;
  correctScans: number;
  accuracy?: number;
  startTime?: Date | null;
  endTime?: Date | null;
  sessionDuration?: number;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ScanService {
  private apiUrl = 'http://localhost:3000/api/scan';

  constructor(private http: HttpClient) {}

  saveScanResult(scanResult: Omit<ScanResult, '_id' | 'user' | 'createdAt'>): Observable<ScanResult> {
    return this.http.post<any>(`${this.apiUrl}/results`, scanResult).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error saving scan result:', error);
        return of(null as any);
      })
    );
  }

  getScanResults(): Observable<ScanResult[]> {
    return this.http.get<any>(`${this.apiUrl}/results`).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error fetching scan results:', error);
        return of([]);
      })
    );
  }

  getScanResult(id: string): Observable<ScanResult> {
    return this.http.get<any>(`${this.apiUrl}/results/${id}`).pipe(
      map(response => response.data),
      catchError(error => {
        console.error(`Error fetching scan result ${id}:`, error);
        return of(null as any);
      })
    );
  }

  detectOrgans(imageData: string): Observable<{detectedOrgan: string}> {
    return this.http.post<any>(`${this.apiUrl}/detect-organs`, { imageData }).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error detecting organs:', error);
        return of({ detectedOrgan: 'No Detection' });
      })
    );
  }
}
