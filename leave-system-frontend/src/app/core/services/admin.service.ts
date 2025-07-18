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

  DepartmentName: string | null;
  JobgroupName: string | null;
  JobTitleName: string | null;

  Department?: number | string | null;
  Jobgroup?: number | string | null;
  JobTitle?: number | string | null;

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

/* ───────── Stats Interfaces ───────── */

export interface LeaveStatusStat {
  status: string;
  count: number;
}

export interface LeaveTypeDaysStat {
  LeaveTypeName: string;
  totalDays: number;
}

export interface LeaveGenderStat {
  gender: string;
  totalDays: number;
}

export interface LeaveMonthlyStat {
  year: number;
  month: number;
  totalDays: number;
}

export interface LeaveDepartmentStat {
  DepartmentName: string;
  totalDays: number;
}

export interface TopLeaveTaker {
  Fullname: string;   // as returned by your API
  LeaveCount: number;
  TotalDays: number;
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
  private statsUrl = 'http://localhost:5000/api/leaves/stats'; 

  constructor(private http: HttpClient, private auth: AuthService) {}

  private opts() {
    const token = this.auth.getToken();
    return token
      ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) }
      : {};
  }

  private h(err: HttpErrorResponse) {
    return throwError(() => err);
  }

  /* Staff */
  getAllStaff(): Observable<Staff[]> {
    return this.http.get<Staff[]>(this.staffUrl, this.opts()).pipe(catchError(this.h));
  }

  getStaffById(id: number): Observable<Staff> {
    return this.http.get<Staff>(`${this.staffUrl}/${id}`, this.opts()).pipe(catchError(this.h));
  }

  /* Job Groups / Titles */
  getJobGroups(): Observable<JobGroup[]> {
    return this.http.get<JobGroup[]>(this.groupsUrl, this.opts()).pipe(catchError(this.h));
  }

  getJobTitles(): Observable<JobTitle[]> {
    return this.http.get<JobTitle[]>(this.titlesUrl, this.opts()).pipe(catchError(this.h));
  }

  /* Leaves */
  getAllLeaves(): Observable<LeaveTx[]> {
    return this.http.get<LeaveTx[]>(this.leavesUrl, this.opts()).pipe(catchError(this.h));
  }

  approveLeave(id: number, status: 'Approved' | 'Rejected'): Observable<any> {
    return this.http.post(`${this.leavesUrl}/${id}/approve`, { status }, this.opts()).pipe(catchError(this.h));
  }

  getLeavesByRange(from: string, to: string): Observable<LeaveTx[]> {
    const url = `${this.leavesUrl}/by-range?from=${from}&to=${to}`;
    return this.http.get<LeaveTx[]>(url, this.opts()).pipe(catchError(this.h));
  }

  /* Stats */
  getLeaveStatusStats(): Observable<LeaveStatusStat[]> {
    return this.http.get<LeaveStatusStat[]>(`${this.statsUrl}/status`, this.opts()).pipe(catchError(this.h));
  }

  getLeaveTypeDaysStats(): Observable<LeaveTypeDaysStat[]> {
    return this.http.get<LeaveTypeDaysStat[]>(`${this.statsUrl}/type-days`, this.opts()).pipe(catchError(this.h));
  }

  getLeaveGenderStats(): Observable<LeaveGenderStat[]> {
    return this.http.get<LeaveGenderStat[]>(`${this.statsUrl}/gender`, this.opts()).pipe(catchError(this.h));
  }

  getLeaveMonthlyStats(): Observable<LeaveMonthlyStat[]> {
    return this.http.get<LeaveMonthlyStat[]>(`${this.statsUrl}/monthly`, this.opts()).pipe(catchError(this.h));
  }

  getLeaveDepartmentStats(): Observable<LeaveDepartmentStat[]> {
    return this.http.get<LeaveDepartmentStat[]>(`${this.statsUrl}/department`, this.opts()).pipe(catchError(this.h));
  }

  getTopLeaveTakers(): Observable<TopLeaveTaker[]> {
    return this.http.get<TopLeaveTaker[]>(`${this.statsUrl}/top`, this.opts()).pipe(catchError(this.h));
  }

  getLeaveStatusCountsByDate(date: string): Observable<LeaveStatusStat[]> {
    const url = `${this.statsUrl}/status-by-date?date=${date}`;
    return this.http.get<LeaveStatusStat[]>(url, this.opts()).pipe(catchError(this.h));
  }
}