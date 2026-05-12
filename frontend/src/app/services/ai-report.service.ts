import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface GeneratedReportFields {
  instructions: string;
  conditionDetails: string;
  additionalNotes: string;
}

export interface AIGenerateResponse {
  success: boolean;
  source: 'claude' | 'gpt' | 'fallback';
  data: GeneratedReportFields;
}

@Injectable({ providedIn: 'root' })
export class AiReportService {
  private apiUrl = 'http://localhost:3000/api/reports/ai';

  constructor(private http: HttpClient) {}

  generateWithClaude(
    diagnosticName: string,
    organName?: string
  ): Observable<AIGenerateResponse> {
    return this.http
      .post<AIGenerateResponse>(`${this.apiUrl}/claude`, { diagnosticName, organName })
      .pipe(
        catchError(() =>
          of({ success: false, source: 'fallback' as const, data: this.getEmptyFields() })
        )
      );
  }

  generateWithGPT(
    diagnosticName: string,
    organName?: string
  ): Observable<AIGenerateResponse> {
    return this.http
      .post<AIGenerateResponse>(`${this.apiUrl}/gpt`, { diagnosticName, organName })
      .pipe(
        catchError(() =>
          of({ success: false, source: 'fallback' as const, data: this.getEmptyFields() })
        )
      );
  }

  private getEmptyFields(): GeneratedReportFields {
    return { instructions: '', conditionDetails: '', additionalNotes: '' };
  }
}
