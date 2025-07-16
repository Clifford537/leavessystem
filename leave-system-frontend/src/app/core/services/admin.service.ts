import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

import { AuthService } from './auth.service'; // JWT provider

/* ─────────────────────────────────────────
 * Models
 * ───────────────────────────────────────── */

export interface Staff {
  ID: number;
  Fullname: string;
  Staffno: string;

  /* Lookup names returned by the backend JOIN/view */
  DepartmentName: string | null;
  JobgroupName: string | null;
  JobTitleName: string | null;

  /* Raw FK IDs (optional) */
  Department?: number | string | null;
  Jobgroup?: number | string | null;
  JobTitle?: number | string | null;

  /* Extra profile fields */
  IDno?: string | null;
  DocType?: 'ID' | 'PASSPORT' | string | null;
  PINno?: string | null;
  NHIF?: string | null;
  NSSF?: string | null;
  Address?: string | null;
  Address2?: string | null;
  Cellphone?: string | null;
  HomeTel?: string | null;
  NextofKin?: string | null;
  NextofKinTel?: string | null;

  Gender: 'Male' | 'Female' | string;
}

export interface JobGroup {
  ID: number;
  Name: string;
  Description?: string;
}

export interface JobTitle {
  ID: number;
  Name: string;
}

export interface LeaveTx {
  ID: number;
  StaffID?: number;
  StaffName: string;
  LeaveTypeID?: number;
  LeaveTypeName: string;
  fDate: string;
  tDate: string;
  DaysDiff: number;
  Approved: 'Pending' | 'Approved' | 'Rejected';
  RemainingDays: number;
}

/* ─────────────────────────────────────────
 * Service
 * ───────────────────────────────────────── */

@Injectable({ providedIn: 'root' })
export class AdminService {
  private staffUrl = 'http://localhost:5000/api/staff';
  private groupsUrl = 'http://localhost:5000/api/jobgroups';
  private titlesUrl = 'http://localhost:5000/api/jobtitles';
  private leavesUrl = 'http://localhost:5000/api/leaves';

  constructor(private http: HttpClient, private auth: AuthService) {}

  /* JWT helper */
  private opts() {
    const token = this.auth.getToken();
    return token
      ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) }
      : {};
  }

  private h(err: HttpErrorResponse) {
    return throwError(() => err);
  }

  /* ───── Staff ───── */
  getAllStaff(): Observable<Staff[]> {
    return this.http
      .get<Staff[]>(this.staffUrl, this.opts())
      .pipe(catchError(this.h));
  }

  getStaffById(id: number): Observable<Staff> {
    return this.http
      .get<Staff>(`${this.staffUrl}/${id}`, this.opts())
      .pipe(catchError(this.h));
  }

  /* ───── Job Groups / Titles ───── */
  getJobGroups(): Observable<JobGroup[]> {
    return this.http
      .get<JobGroup[]>(this.groupsUrl, this.opts())
      .pipe(catchError(this.h));
  }

  getJobTitles(): Observable<JobTitle[]> {
    return this.http
      .get<JobTitle[]>(this.titlesUrl, this.opts())
      .pipe(catchError(this.h));
  }

  /* ───── Leaves ───── */
  getAllLeaves(): Observable<LeaveTx[]> {
    return this.http
      .get<LeaveTx[]>(this.leavesUrl, this.opts())
      .pipe(catchError(this.h));
  }

  approveLeave(id: number, status: 'Approved' | 'Rejected'): Observable<any> {
    return this.http
      .post(`${this.leavesUrl}/${id}/approve`, { status }, this.opts())
      .pipe(catchError(this.h));
  }

  /**
   * Get leave transactions that overlap a given date range
   * For calendar/day view
   */
  getLeavesByRange(from: string, to: string): Observable<LeaveTx[]> {
    const url = `${this.leavesUrl}/by-range?from=${from}&to=${to}`;
    return this.http
      .get<LeaveTx[]>(url, this.opts())
      .pipe(catchError(this.h));
  }
}
