import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  email?: string;
  phone?: string;
  address?: string;
  medicalHistory?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private apiUrl = 'http://localhost:3000/api/patients';

  constructor(private http: HttpClient) {}

  getPatients(): Observable<Patient[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error fetching patients:', error);
        return of([]);
      })
    );
  }

  getPatient(id: string): Observable<Patient> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data),
      catchError(error => {
        console.error(`Error fetching patient ${id}:`, error);
        return of(null as any);
      })
    );
  }

  createPatient(patient: Omit<Patient, '_id' | 'createdAt' | 'updatedAt' | '__v'>): Observable<Patient> {
    return this.http.post<any>(this.apiUrl, patient).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error creating patient:', error);
        return of(null as any);
      })
    );
  }

  updatePatient(id: string, patient: Partial<Patient>): Observable<Patient> {
    // Create a copy of patient data without MongoDB specific fields
    const patientData = { ...patient };
    delete patientData._id;
    delete patientData.__v;
    delete patientData.createdAt;
    delete patientData.updatedAt;

    return this.http.put<any>(`${this.apiUrl}/${id}`, patientData).pipe(
      map(response => response.data),
      catchError(error => {
        console.error(`Error updating patient ${id}:`, error);
        return of(null as any);
      })
    );
  }

  deletePatient(id: string): Observable<boolean> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.success),
      catchError(error => {
        console.error(`Error deleting patient ${id}:`, error);
        return of(false);
      })
    );
  }
}
