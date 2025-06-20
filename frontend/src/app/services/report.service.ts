import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PdfService } from './pdf.service';
import { Patient } from './patient.service';

export interface ScanImage {
  imageUrl: string;
  organ: string;
}

export interface PatientReport {
  _id?: string;
  friendlyId?: string;
  user?: string;
  patient: string;
  scanImages: ScanImage[];
  diagnosticName: string;
  instructions?: string;
  conditionDetails?: string;
  additionalNotes?: string;
  createdAt?: string;
}

export interface PatientReportWithPatient {
  _id?: string;
  friendlyId?: string;
  user?: string;
  patient: Patient;
  scanImages: ScanImage[];
  diagnosticName: string;
  instructions?: string;
  conditionDetails?: string;
  additionalNotes?: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private calculateAge(dateOfBirth: string): string {
    if (!dateOfBirth) return 'N/A';
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    if (
      today.getMonth() < dob.getMonth() ||
      (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())
    ) {
      age--;
    }
    return `${age} Years`;
  }
  private apiUrl = 'http://localhost:3000/api/reports';

  constructor(private http: HttpClient) {}

  savePatientReport(
    report: Omit<PatientReport, '_id' | 'user' | 'createdAt'>
  ): Observable<PatientReport> {
    return this.http.post<any>(this.apiUrl, report).pipe(
      map(async (response) => {
        const savedReport = response.data;
        // After saving, generate PDF
        if (savedReport) {
          const patientResponse = await this.http
            .get<any>(`http://localhost:3000/api/patients/${report.patient}`)
            .toPromise();
          const patient = patientResponse.data;

          // Open PDF in new window after generation
          const pdfService = new PdfService();
          await pdfService.generatePdfReport(savedReport, patient);
        }
        return savedReport;
      }),
      catchError((error) => {
        console.error('Error saving patient report:', error);
        return of(null as any);
      })
    );
  }

  getPatientReports(): Observable<PatientReportWithPatient[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map((response) => response.data),
      catchError((error) => {
        console.error('Error fetching patient reports:', error);
        return of([]);
      })
    );
  }

  getPatientReport(id: string): Observable<PatientReportWithPatient> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((response) => response.data),
      catchError((error) => {
        console.error('Error fetching patient report:', error);
        return of(null as any);
      })
    );
  }

  updatePatientReport(
    id: string,
    reportData: Partial<PatientReportWithPatient>
  ): Observable<PatientReportWithPatient> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, reportData).pipe(
      map((response) => response.data),
      catchError((error) => {
        console.error('Error updating patient report:', error);
        return of(null as any);
      })
    );
  }

  deletePatientReport(id: string): Observable<boolean> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      map((response) => response.success),
      catchError((error) => {
        console.error('Error deleting patient report:', error);
        return of(false);
      })
    );
  }
}
