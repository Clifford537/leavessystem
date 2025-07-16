import {
  Component,
  OnInit,
  ViewChild,
  TemplateRef,
  Directive,
  ElementRef,
  Input,
  OnChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule, MatDatepicker } from '@angular/material/datepicker';
import { MatCalendar } from '@angular/material/datepicker';

import {
  AdminService,
  JobGroup,
  JobTitle,
  LeaveTx,
  Staff
} from '../../core/services/admin.service';

@Directive({
  selector: '[calendarBadge]',
})
export class CalendarBadgeDirective implements OnChanges {
  @Input() calendarBadge: string = '';

  constructor(private el: ElementRef) {}

  ngOnChanges() {
    this.el.nativeElement.setAttribute('data-badge', this.calendarBadge);
  }
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatCalendar
  ],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent implements OnInit {
  @ViewChild('calendarDialog') calendarDialog!: TemplateRef<unknown>;
  @ViewChild('leaveTableDialog') leaveTableDialog!: TemplateRef<unknown>;
  @ViewChild('detailDialog') detailDialog!: TemplateRef<unknown>;
  @ViewChild(MatDatepicker) datepicker!: MatDatepicker<Date>;

  staff: Staff[] = [];
  jobGroups: JobGroup[] = [];
  jobTitles: JobTitle[] = [];
  leaves: LeaveTx[] = [];

  leavesByDate = new Map<string, LeaveTx[]>();

  loadingStaff = false;
  loadingGroups = false;
  loadingTitles = false;
  loadingLeaves = false;

  selectedStaff?: Staff;
  selectedDate: Date = new Date();
  leavesOnSelectedDate: LeaveTx[] = [];

  displayedStaff = ['ID', 'Fullname', 'DepartmentName', 'JobgroupName', 'JobTitleName', 'view'];
  displayedLeaves = ['ID', 'Staff', 'Type', 'From', 'To', 'Days','Status', 'actions'];

  activeView: 'leave' | 'users' | 'titles' | 'groups' = 'leave';

  constructor(
    private admin: AdminService,
    private snack: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.fetchStaff();
    this.fetchJobGroups();
    this.fetchJobTitles();
    this.fetchLeaves();
  }

  setView(view: typeof this.activeView) {
    this.activeView = view;
  }

  private fetchStaff() {
    this.loadingStaff = true;
    this.admin.getAllStaff().subscribe({
      next: d => this.staff = d,
      error: e => this.snack.open(e.error?.message ?? 'Fail loading staff', 'OK'),
      complete: () => this.loadingStaff = false
    });
  }

  private fetchJobGroups() {
    this.loadingGroups = true;
    this.admin.getJobGroups().subscribe({
      next: d => this.jobGroups = d,
      error: e => this.snack.open(e.error?.message ?? 'Fail loading groups', 'OK'),
      complete: () => this.loadingGroups = false
    });
  }

  private fetchJobTitles() {
    this.loadingTitles = true;
    this.admin.getJobTitles().subscribe({
      next: d => this.jobTitles = d,
      error: e => this.snack.open(e.error?.message ?? 'Fail loading titles', 'OK'),
      complete: () => this.loadingTitles = false
    });
  }

  private fetchLeaves() {
    this.loadingLeaves = true;
    this.admin.getAllLeaves().subscribe({
      next: d => {
        this.leaves = d;
        this.groupLeavesByFDate(d);
      },
      error: e => this.snack.open(e.error?.message ?? 'Fail loading leaves', 'OK'),
      complete: () => this.loadingLeaves = false
    });
  }

  private groupLeavesByFDate(leaves: LeaveTx[]) {
    this.leavesByDate.clear();
    for (const leave of leaves) {
      const key = this.formatDateKey(new Date(leave.fDate));
      const list = this.leavesByDate.get(key) || [];
      list.push(leave);
      this.leavesByDate.set(key, list);
    }
  }

  formatDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getLeaveCountBadge(date: Date): number | null {
    const key = this.formatDateKey(date);
    const leaves = this.leavesByDate.get(key);
    return leaves ? leaves.length : null;
  }

  hasPendingLeave(date: Date): boolean {
    const key = this.formatDateKey(date);
    const leaves = this.leavesByDate.get(key);
    return leaves ? leaves.some(l => l.Approved === 'Pending') : false;
  }

  highlightLeaveDays = (date: Date): string => {
    const key = this.formatDateKey(date);
    const leaves = this.leavesByDate.get(key);

    const count = leaves?.length || 0;
    setTimeout(() => {
      const cells = document.querySelectorAll('.mat-calendar-body-cell-content');
      cells.forEach(el => {
        const day = Number(el.textContent);
        if (!day || isNaN(day)) return;
        const testDate = new Date(date);
        testDate.setDate(day);
        const cellKey = this.formatDateKey(testDate);
        if (cellKey === key && count > 0) {
          el.setAttribute('data-count', String(count));
        }
      });
    }, 0);

    return leaves?.some(l => l.Approved === 'Pending') ? 'pending-leave-day' : '';
  };

  viewStaff(s: Staff) {
    this.selectedStaff = s;
    this.dialog.open(this.detailDialog, { width: '600px' });
  }

  approve(id: number, status: 'Approved' | 'Rejected') {
    this.admin.approveLeave(id, status).subscribe({
      next: () => {
        this.snack.open(`Leave ${status.toLowerCase()}`, 'OK', { duration: 2500 });
        const row = this.leaves.find(l => l.ID === id);
        if (row) row.Approved = status;
        this.onDateSelected(this.selectedDate);
        this.fetchLeaves();
      },
      error: e => this.snack.open(e.error?.message ?? 'Update failed', 'OK')
    });
  }

  onDateSelected(date: Date): void {
    this.selectedDate = date;
    const from = this.formatDateKey(date);
    const to = from;
    this.admin.getLeavesByRange(from, to).subscribe({
      next: (leaves) => {
        this.leavesOnSelectedDate = leaves;
      },
      error: (e) => {
        this.snack.open(e.error?.message ?? 'Failed to load leaves by date', 'OK');
        this.leavesOnSelectedDate = [];
      }
    });
  }

  openCalendarDialog(date: Date | null): void {
    if (!date) return;
    this.onDateSelected(date);
    this.dialog.open(this.calendarDialog, { width: '500px' });
  }

  openLeaveTableDialog(): void {
    this.dialog.open(this.leaveTableDialog, { width: '1000px' });
  }
}
