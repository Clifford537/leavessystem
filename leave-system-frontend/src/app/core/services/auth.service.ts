import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  BehaviorSubject,
  catchError,
  tap,
  throwError
} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly BASE_URL  = 'http://localhost:5000/api/auth';
  private readonly TOKEN_KEY = 'jwt';

  /** Emits `true` when a JWT exists, `false` when logged out */
  private authState$$ = new BehaviorSubject<boolean>(this.hasToken());
  isLoggedIn$         = this.authState$$.asObservable();

  constructor(private http: HttpClient) {}

  /* ─────────────── API calls ─────────────── */

  /**
   * POST /api/auth/login
   */
  login(credentials: { idno: string; password: string }) {
    return this.http.post<any>(`${this.BASE_URL}/login`, credentials).pipe(
      tap(res => this.setToken(res.token)),   // store JWT on success
      catchError(this.handleError)
    ).toPromise();
  }

  /**
   * POST /api/auth/setpassword
   */
  setPassword(data: { idno: string; staffno: string; password: string }) {
    return this.http.post<any>(`${this.BASE_URL}/setpassword`, data).pipe(
      catchError(this.handleError)
    ).toPromise();
  }

  /**
   * POST /api/auth/verify-user
   */
  verifyUser(data: { idno: string; staffno: string }) {
    return this.http.post<any>(`${this.BASE_URL}/verify-user`, data).pipe(
      catchError(this.handleError)
    ).toPromise();
  }

  /* ─────────────── helpers ─────────────── */

  /** Retrieve raw JWT or `null` */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /** Snapshot boolean */
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  /** Remove token and broadcast logout */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.authState$$.next(false);
  }

  /* ─────────────── private ─────────────── */

  private setToken(token: string): void {
    if (token) {
      localStorage.setItem(this.TOKEN_KEY, token);
      this.authState$$.next(true);
    }
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  private handleError(error: HttpErrorResponse) {
    return throwError(() => error);
  }
}
