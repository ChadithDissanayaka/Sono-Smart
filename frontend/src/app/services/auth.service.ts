import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'professional' | 'trainee';
  specialization?: string;
  institution?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  refreshToken?: string;
  user: User;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);
  
  public currentUser$ = this.currentUserSubject.asObservable();
  public token$ = this.tokenSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadStoredUserData();
  }

  private loadStoredUserData(): void {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    
    if (storedUser && storedToken) {
      this.currentUserSubject.next(JSON.parse(storedUser));
      this.tokenSubject.next(storedToken);
      if (storedRefreshToken) {
        this.refreshTokenSubject.next(storedRefreshToken);
      }
    }
  }

  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const minLength = 8;
    
    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: 'professional' | 'trainee';
  }): Observable<AuthResponse> {
    const passwordValidation = this.validatePassword(userData.password);
    if (!passwordValidation.isValid) {
      return throwError(() => ({ success: false, message: passwordValidation.errors.join('. ') }));
    }

    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData)
      .pipe(
        tap(response => {
          if (response.success && response.token) {
            this.storeUserData(response.user, response.token, response.refreshToken);
          }
        }),
        catchError(error => {
          return throwError(() => error.error || { success: false, message: 'Registration failed' });
        })
      );
  }

  login(email: string, password: string, rememberMe: boolean = false): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password, rememberMe })
      .pipe(
        tap(response => {
          if (response.success && response.token) {
            this.storeUserData(response.user, response.token, response.refreshToken);
          }
        }),
        catchError(error => {
          return throwError(() => error.error || { success: false, message: 'Login failed' });
        })
      );
  }

  private storeUserData(user: User, token: string, refreshToken?: string): void {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
      this.refreshTokenSubject.next(refreshToken);
    }
    this.currentUserSubject.next(user);
    this.tokenSubject.next(token);
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.refreshTokenSubject.value;
    if (!refreshToken) {
      return throwError(() => ({ success: false, message: 'No refresh token available' }));
    }

    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh-token`, { refreshToken })
      .pipe(
        tap(response => {
          if (response.success && response.token) {
            this.storeUserData(response.user, response.token, response.refreshToken);
          }
        }),
        catchError(error => {
          this.logout();
          return throwError(() => error.error || { success: false, message: 'Token refresh failed' });
        })
      );
  }

  logout(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    this.currentUserSubject.next(null);
    this.tokenSubject.next(null);
    this.refreshTokenSubject.next(null);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return this.tokenSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getUserRole(): string | null {
    const user = this.getCurrentUser();
    return user ? user.role : null;
  }
}