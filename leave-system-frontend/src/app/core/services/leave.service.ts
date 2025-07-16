import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders
} from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

import { AuthService } from './auth.service';   // <-- pulls JWT from here

/* ───────── Data‑transfer objects ───────── */
export interface CreateLeaveDto {
  LeaveTypeID: number;
  fDate: string;       // 'YYYY-MM-DD'
  tDate: string;       // 'YYYY-MM-DD'
  Notes?: string;
}

export interface LeaveBalance {
  leaveTypeId:   number;
  leaveTypeName: string;
  remaining:     number;
}

export interface LeaveTransaction {
  ID:            number;
  LeaveTypeID:   number;
  LeaveTypeName: string;
  fDate:         string;
  tDate:         string;
  Notes:         string | null;
  DaysDiff:      number;
  Approved:      'Pending' | 'Approved' | 'Rejected';
}

@Injectable({ providedIn: 'root' })
export class LeaveService {

  /** Base path now points to /api/leaves (plural) */
  private readonly BASE = 'http://localhost:5000/api/leaves';

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  /* ───────── helpers ───────── */

  /** Attach JWT if available */
  private authOpts() {
    const token = this.auth.getToken();
    return token
      ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) }
      : {};
  }

  private handle(err: HttpErrorResponse) {
    return throwError(() => err);
  }

  /* ───────── API calls ───────── */

  /** POST  /api/leaves  → create a leave */
  createLeave(dto: CreateLeaveDto): Observable<any> {
    return this.http.post(`${this.BASE}`, dto, this.authOpts())
      .pipe(catchError(this.handle));
  }

  /** GET  /api/leaves/balances  → current remaining days (Approved + Pending) */
  getBalances(): Observable<LeaveBalance[]> {
    return this.http.get<LeaveBalance[]>(`${this.BASE}/balances`, this.authOpts())
      .pipe(catchError(this.handle));
  }

  /** GET  /api/leaves/mine  → transactions for the logged‑in user */
  getMyLeaves(): Observable<LeaveTransaction[]> {
    return this.http.get<LeaveTransaction[]>(`${this.BASE}/mine`, this.authOpts())
      .pipe(catchError(this.handle));
  }
}
