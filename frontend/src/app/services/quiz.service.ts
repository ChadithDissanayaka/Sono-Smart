import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface QuizAnswer {
  questionId: number;
  selectedAnswer: number;
  isCorrect: boolean;
}

export interface QuizResult {
  _id?: string;
  user?: string;
  correctAnswers: number;
  totalQuestions: number;
  accuracy?: number;
  timeSpent: string;
  startTime?: Date | null;
  endTime?: Date | null;
  sessionDuration?: number;
  answers: QuizAnswer[];
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  private apiUrl = 'http://localhost:3000/api/quiz';

  constructor(private http: HttpClient) {}

  saveQuizResult(quizResult: Omit<QuizResult, '_id' | 'user' | 'createdAt'>): Observable<QuizResult> {
    return this.http.post<any>(`${this.apiUrl}/results`, quizResult).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error saving quiz result:', error);
        return of(null as any);
      })
    );
  }

  getQuizResults(): Observable<QuizResult[]> {
    return this.http.get<any>(`${this.apiUrl}/results`).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error fetching quiz results:', error);
        return of([]);
      })
    );
  }

  getQuizResult(id: string): Observable<QuizResult> {
    return this.http.get<any>(`${this.apiUrl}/results/${id}`).pipe(
      map(response => response.data),
      catchError(error => {
        console.error(`Error fetching quiz result ${id}:`, error);
        return of(null as any);
      })
    );
  }
}
