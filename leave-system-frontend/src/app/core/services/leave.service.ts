import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders
} from '@angular/common/http';
import { Observable, catchError, throwError, map } from 'rxjs';
import { AuthService } from './auth.service';

export interface CreateLeaveDto {
  LeaveTypeID: number;
  fDate: string;
  tDate: string;
  Notes?: string;
  Attachment?: string | File;
}

export interface LeaveBalance {
  leaveTypeId: number;
  leaveTypeName: string;
  remaining: number;
}

export interface LeaveTransaction {
  ID: number;
  LeaveTypeID: number;
  LeaveTypeName: string;
  fDate: string;
  tDate: string;
  Notes: string | null;
  DaysDiff: number;
  Approved: 'Pending' | 'Approved' | 'Rejected';
  Attachment: string | null;
}

@Injectable({ providedIn: 'root' })
export class LeaveService {
  private readonly BASE = 'http://localhost:5000/api/leaves';
  private readonly UPLOADS_BASE = 'http://localhost:5000';

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  private authOpts() {
    const token = this.auth.getToken();
    return token
      ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) }
      : {};
  }

  private handle(err: HttpErrorResponse) {
    return throwError(() => err);
  }

  createLeave(formData: FormData): Observable<any> {
    return this.http.post(`${this.BASE}`, formData, this.authOpts())
      .pipe(catchError(this.handle));
  }

  getBalances(): Observable<LeaveBalance[]> {
    return this.http.get<LeaveBalance[]>(`${this.BASE}/balances`, this.authOpts())
      .pipe(catchError(this.handle));
  }

  getMyLeaves(): Observable<LeaveTransaction[]> {
    return this.http.get<LeaveTransaction[]>(`${this.BASE}/mine`, this.authOpts())
      .pipe(
        map(leaves => leaves.map(leave => ({
          ...leave,
          Attachment: leave.Attachment && leave.Attachment.startsWith('/uploads')
            ? `${this.UPLOADS_BASE}${leave.Attachment}`
            : leave.Attachment
        }))),
        catchError(this.handle)
      );
  }
}