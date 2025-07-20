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
  Chart,
  ChartConfiguration,
  ChartOptions,
  PieController,
  BarController,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip
} from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

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

// Register chart.js components
Chart.register(
  PieController,
  BarController,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip
);

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
    FullCalendarModule,
    BaseChartDirective
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

  // Chart configurations
  leaveStatusChartData: ChartConfiguration['data'] = { datasets: [], labels: [] };
  leaveTypeDaysChartData: ChartConfiguration['data'] = { datasets: [], labels: [] };
  leaveGenderChartData: ChartConfiguration['data'] = { datasets: [], labels: [] };
  topLeaveTakersChartData: ChartConfiguration['data'] = { datasets: [], labels: [] };
  leaveMonthlyChartData: ChartConfiguration['data'] = { datasets: [], labels: [] };
  leaveDepartmentChartData: ChartConfiguration['data'] = { datasets: [], labels: [] };

  pieChartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      tooltip: { enabled: true }
    }
  };

  barChartOptions: ChartOptions = {
    responsive: true,
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Days' } },
      x: { title: { display: true, text: 'Category' } }
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true }
    },
  };

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
      const el = document.createElement('div');
      el.className = 'fc-event-content';
      el.innerHTML = `<div class="event-title">${title}</div>`;
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
            extendedProps: { ...l }
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
        this.leaveStatusChartData = {
          labels: this.leaveStatusStats.map(s => s.status),
          datasets: [{
            data: this.leaveStatusStats.map(s => s.count),
            backgroundColor: ['#28a745', '#e3dc12ff', '#e75a0fff'],
            hoverBackgroundColor: ['#218838', '#e3dc12ff', '#d94f0f']
          }]
        };
      },
      error: () => this.snack.open('Failed to load leave status stats', 'OK')
    });

    this.admin.getLeaveTypeDaysStats().subscribe({
      next: stats => {
        this.leaveTypeDaysStats = stats.map(item => ({
          LeaveTypeName: (item as any).LeaveType ?? item.LeaveTypeName,
          totalDays: (item as any).TotalDays ?? item.totalDays
        }));
        this.leaveTypeDaysChartData = {
          labels: this.leaveTypeDaysStats.map(s => s.LeaveTypeName),
          datasets: [{
            data: this.leaveTypeDaysStats.map(s => s.totalDays),
            backgroundColor: '#0284c7',
            hoverBackgroundColor: '#0369a1'
          }]
        };
      },
      error: () => this.snack.open('Failed to load leave type days stats', 'OK')
    });

    this.admin.getLeaveGenderStats().subscribe({
      next: stats => {
        this.leaveGenderStats = stats.map(item => ({
          gender: (item as any).Gender ?? item.gender,
          totalDays: (item as any).TotalDays ?? item.totalDays
        }));
        this.leaveGenderChartData = {
          labels: this.leaveGenderStats.map(s => s.gender),
          datasets: [{
            data: this.leaveGenderStats.map(s => s.totalDays),
            backgroundColor: ['#0284c7', '#d97706'],
            hoverBackgroundColor: ['#0369a1', '#b86505']
          }]
        };
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
        this.leaveMonthlyChartData = {
          labels: this.leaveMonthlyStats.map(s => `${s.year}-${s.month.toString().padStart(2, '0')}`),
          datasets: [{
            data: this.leaveMonthlyStats.map(s => s.totalDays),
            backgroundColor: '#42a5f5',
            hoverBackgroundColor: '#3b8ed5'
          }]
        };
      },
      error: () => this.snack.open('Failed to load leave monthly stats', 'OK')
    });

    this.admin.getLeaveDepartmentStats().subscribe({
      next: stats => {
        this.leaveDepartmentStats = stats.map(item => ({
          DepartmentName: (item as any).Department ?? item.DepartmentName,
          totalDays: (item as any).RequestCount ?? item.totalDays
        }));
        this.leaveDepartmentChartData = {
          labels: this.leaveDepartmentStats.map(s => s.DepartmentName),
          datasets: [{
            data: this.leaveDepartmentStats.map(s => s.totalDays),
            backgroundColor: '#059669',
            hoverBackgroundColor: '#047a55'
          }]
        };
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
        this.topLeaveTakersChartData = {
          labels: this.topLeaveTakers.map(s => s.Fullname),
          datasets: [{
            data: this.topLeaveTakers.map(s => s.TotalDays),
            backgroundColor: '#d97706',
            hoverBackgroundColor: '#b86505'
          }]
        };
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
      case 'Pending': return '#dbd523ff';
      case 'Approved': return '#1b9738ff';
      case 'Rejected': return '#df6523d6';
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
    const selectedDateStr = this.formatDateKey(date);
    // Filter leaves where the selected date is between fDate and tDate (inclusive)
    this.leavesOnSelectedDate = this.leaves.filter(leave => {
      const fDate = this.formatDateKey(new Date(leave.fDate));
      const tDate = this.formatDateKey(new Date(leave.tDate));
      return selectedDateStr >= fDate && selectedDateStr <= tDate;
    });
    // If no leaves found locally, try fetching from the server
    if (this.leavesOnSelectedDate.length === 0) {
      const from = this.formatDateKey(date);
      const to = from; // Keep single-day fetch for consistency
      this.admin.getLeavesByRange(from, to).subscribe({
        next: leaves => {
          this.leavesOnSelectedDate = leaves.filter(leave => {
            const fDate = this.formatDateKey(new Date(leave.fDate));
            const tDate = this.formatDateKey(new Date(leave.tDate));
            return selectedDateStr >= fDate && selectedDateStr <= tDate;
          });
        },
        error: e => {
          this.snack.open(e.error?.message ?? 'Failed to load leaves by date', 'OK');
          this.leavesOnSelectedDate = [];
        }
      });
    }
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