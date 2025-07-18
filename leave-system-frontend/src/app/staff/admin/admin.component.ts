import {
  Component,
  OnInit,
  ViewChild,
  TemplateRef
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
import { MatDatepickerModule } from '@angular/material/datepicker';

import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarOptions, EventClickArg } from '@fullcalendar/core';

import {
  AdminService,
  JobGroup,
  JobTitle,
  LeaveTx,
  Staff,
  LeaveStatusStat,
  LeaveTypeDaysStat,
  LeaveGenderStat,
  LeaveMonthlyStat,
  LeaveDepartmentStat,
  TopLeaveTaker
} from '../../core/services/admin.service';

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
    FullCalendarModule
  ],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent implements OnInit {
  @ViewChild('calendarDialog') calendarDialog!: TemplateRef<unknown>;
  @ViewChild('leaveTableDialog') leaveTableDialog!: TemplateRef<unknown>;
  @ViewChild('detailDialog') detailDialog!: TemplateRef<unknown>;

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
  displayedLeaves = ['ID', 'Staff', 'Type', 'From', 'To', 'Days', 'Status', 'actions'];

  activeView: 'leave' | 'users' | 'titles' | 'groups' | 'stats' = 'leave';

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth'
    },
    events: [],
    editable: false,
    selectable: true,
    dateClick: this.onDateClick.bind(this),
    eventClick: this.onEventClick.bind(this),
    eventContent: (arg) => {
      const title = arg.event.title;
      const leaveCount = this.leavesByDate.get(this.formatDateKey(arg.event.start!))?.length || 0;
      const el = document.createElement('div');
      el.className = 'fc-event-content';
      // Display the event title and leave count (in brackets) for the date, showing the total number of leaves
      el.innerHTML = `
        <div class="event-title">${title}</div>
        ${leaveCount > 0 ? `<span class="leave-count-badge">(${leaveCount})</span>` : ''}
      `;
      return { domNodes: [el] };
    }
  };

  leaveStatusStats: LeaveStatusStat[] = [];
  leaveTypeDaysStats: LeaveTypeDaysStat[] = [];
  leaveGenderStats: LeaveGenderStat[] = [];
  leaveMonthlyStats: LeaveMonthlyStat[] = [];
  leaveDepartmentStats: LeaveDepartmentStat[] = [];
  topLeaveTakers: TopLeaveTaker[] = [];

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
    this.fetchStats();
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
        this.calendarOptions = {
          ...this.calendarOptions,
          events: d.map(l => ({
            title: `${l.StaffName} - ${l.LeaveTypeName}`,
            start: l.fDate,
            end: l.tDate,
            color: this.getLeaveColor(l.Approved),
            extendedProps: { ...l, leaveCount: this.leavesByDate.get(this.formatDateKey(new Date(l.fDate)))?.length || 0 }
          }))
        };
      },
      error: e => this.snack.open(e.error?.message ?? 'Fail loading leaves', 'OK'),
      complete: () => this.loadingLeaves = false
    });
  }

  private fetchStats() {
    this.admin.getLeaveStatusStats().subscribe({
      next: stats => {
        this.leaveStatusStats = stats.map(item => ({
          status: (item as any).Approved ?? item.status,
          count: item.count
        }));
      },
      error: () => this.snack.open('Failed to load leave status stats', 'OK')
    });

    this.admin.getLeaveTypeDaysStats().subscribe({
      next: stats => {
        this.leaveTypeDaysStats = stats.map(item => ({
          LeaveTypeName: (item as any).LeaveType ?? item.LeaveTypeName,
          totalDays: (item as any).TotalDays ?? item.totalDays
        }));
      },
      error: () => this.snack.open('Failed to load leave type days stats', 'OK')
    });

    this.admin.getLeaveGenderStats().subscribe({
      next: stats => {
        this.leaveGenderStats = stats.map(item => ({
          gender: (item as any).Gender ?? item.gender,
          totalDays: (item as any).TotalDays ?? item.totalDays
        }));
      },
      error: () => this.snack.open('Failed to load leave gender stats', 'OK')
    });

    this.admin.getLeaveMonthlyStats().subscribe({
      next: stats => {
        this.leaveMonthlyStats = stats.map(item => {
          const monthStr = (item as any).Month ?? '';
          const totalDays = (item as any).TotalDays ?? item.totalDays;
          const [year, month] = monthStr.split('-').map(Number);
          return { year, month, totalDays };
        });
      },
      error: () => this.snack.open('Failed to load leave monthly stats', 'OK')
    });

    this.admin.getLeaveDepartmentStats().subscribe({
      next: stats => {
        this.leaveDepartmentStats = stats.map(item => ({
          DepartmentName: (item as any).Department ?? item.DepartmentName,
          totalDays: (item as any).RequestCount ?? item.totalDays
        }));
      },
      error: () => this.snack.open('Failed to load leave department stats', 'OK')
    });

    this.admin.getTopLeaveTakers().subscribe({
      next: stats => {
        this.topLeaveTakers = stats.map(item => ({
          Fullname: item.Fullname,
          LeaveCount: item.LeaveCount,
          TotalDays: item.TotalDays
        }));
      },
      error: () => this.snack.open('Failed to load top leave takers', 'OK')
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

  getLeaveColor(status: string): string {
    switch (status) {
      case 'Pending': return '#fff707ff';
      case 'Approved': return '#28a745';
      case 'Rejected': return '#e75a0fff';
      default: return '#007bff';
    }
  }

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
      next: leaves => this.leavesOnSelectedDate = leaves,
      error: e => {
        this.snack.open(e.error?.message ?? 'Failed to load leaves by date', 'OK');
        this.leavesOnSelectedDate = [];
      }
    });
  }

  onDateClick(arg: any) {
    this.selectedDate = new Date(arg.date);
    this.onDateSelected(this.selectedDate);
    this.dialog.open(this.calendarDialog, { width: '500px' });
  }

  onEventClick(arg: EventClickArg) {
    this.selectedDate = new Date(arg.event.start!);
    this.onDateSelected(this.selectedDate);
    this.dialog.open(this.calendarDialog, { width: '500px' });
  }

  openLeaveTableDialog(): void {
    this.dialog.open(this.leaveTableDialog, { width: '1000px' });
  }
}