import {
  Component,
  OnInit,
  ViewChild,
  TemplateRef
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import {
  LeaveService,
  LeaveBalance,
  LeaveTransaction,
  CreateLeaveDto
} from '../../core/services/leave.service';
import { finalize } from 'rxjs/operators';

// Define custom EventInput interface to type extendedProps
interface CustomEventInput extends EventInput {
  extendedProps: {
    status: string;
  };
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatSnackBarModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    FullCalendarModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  @ViewChild('leaveDialog') leaveDialog!: TemplateRef<unknown>;
  @ViewChild('balancesDialog') balancesDialog!: TemplateRef<unknown>;
  @ViewChild('historyDialog') historyDialog!: TemplateRef<unknown>;
  @ViewChild('leaveDetailsDialog') leaveDetailsDialog!: TemplateRef<unknown>;
  private dialogRef?: MatDialogRef<unknown>;

  leaveForm!: FormGroup;
  balances: LeaveBalance[] = [];
  myLeaves: LeaveTransaction[] = [];
  filteredLeaves: LeaveTransaction[] = [];
  leaveTypes: string[] = [];
  selectedType: string = '';
  searchQuery: string = '';
  selectedLeave: LeaveTransaction | null = null;
  loading = false;
  readonly MIN_SPIN_MS = 2000;
  errorMsg: string | null = null;
  displayedColumns = ['index', 'Type', 'From', 'To', 'Days', 'Status'];
  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin],
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: ''
    },
    displayEventTime: false, // Suppress time display in event titles
    events: [],
    eventClassNames: (arg) => {
      return arg.event.extendedProps['status'].toLowerCase();
    },
    eventClick: (arg) => {
      const leave = this.filteredLeaves.find(l => l.ID === Number(arg.event.id));
      if (leave) {
        this.openLeaveDetailsDialog(leave);
      }
    }
  };

  constructor(
    private fb: FormBuilder,
    private leaveSvc: LeaveService,
    private snack: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.leaveForm = this.fb.group({
      LeaveTypeID: [null, Validators.required],
      fDate: [null, Validators.required],
      tDate: [null, Validators.required],
      Notes: ['']
    });
    this.refresh();
  }

  // Method to get event color based on leave status
  getLeaveColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'approved':
        return '#129140ff'; // Green for Approved
      case 'pending':
        return '#eab308'; // Yellow for Pending
      case 'rejected':
        return '#d35933ff'; // Brown for Rejected
      default:
        return '#0284c7'; // Blue as fallback
    }
  }

  /* ─────── Dialog Controls ─────── */
  openLeaveDialog(): void {
    this.leaveForm.reset();
    this.errorMsg = null;
    this.dialogRef = this.dialog.open(this.leaveDialog, { width: '480px' });
  }

  openBalancesDialog(): void {
    this.dialog.open(this.balancesDialog, { width: '420px' });
  }

  openHistoryDialog(): void {
    this.dialog.open(this.historyDialog, { width: '720px' });
  }

  openLeaveDetailsDialog(leave: LeaveTransaction): void {
    this.selectedLeave = leave;
    this.dialog.open(this.leaveDetailsDialog, { width: '480px' });
  }

  /* ─────── Submit Leave ─────── */
  submit(): void {
    if (this.leaveForm.invalid) return;

    this.errorMsg = null;
    this.loading = true;
    const start = Date.now();
    const dto: CreateLeaveDto = this.leaveForm.value;

    this.leaveSvc.createLeave(dto)
      .pipe(finalize(() => {
        const elapsed = Date.now() - start;
        const stop = () => (this.loading = false);
        elapsed < this.MIN_SPIN_MS
          ? setTimeout(stop, this.MIN_SPIN_MS - elapsed)
          : stop();
      }))
      .subscribe({
        next: res => {
          this.snack.open(res.message, 'OK', { duration: 3000 });
          this.dialogRef?.close();
          this.refresh();
        },
        error: err => {
          this.errorMsg = err.status === 409
            ? err.error?.message ?? 'Insufficient balance'
            : err.error?.message ?? 'Request failed';
          this.snack.open(this.errorMsg ?? 'An error occurred', 'OK', { duration: 3000 });
          this.errorMsg = null;
        }
      });
  }

  /* ─────── Refresh & Filter ─────── */
  private refresh(): void {
    this.loading = true;
    const start = Date.now();

    this.leaveSvc.getBalances()
      .pipe(finalize(() => {
        const elapsed = Date.now() - start;
        const stop = () => (this.loading = false);
        elapsed < this.MIN_SPIN_MS
          ? setTimeout(stop, this.MIN_SPIN_MS - elapsed)
          : stop();
      }))
      .subscribe({
        next: b => {
          this.balances = b;
        },
        error: err => {
          const msg = err.error?.message ?? 'Failed to load balances';
          this.snack.open(msg, 'OK', { duration: 3000 });
        }
      });

    this.leaveSvc.getMyLeaves()
      .pipe(finalize(() => {
        const elapsed = Date.now() - start;
        const stop = () => (this.loading = false);
        elapsed < this.MIN_SPIN_MS
          ? setTimeout(stop, this.MIN_SPIN_MS - elapsed)
          : stop();
      }))
      .subscribe({
        next: leaves => {
          console.log('Raw Leaves:', leaves); // Debug: Log raw leave data
          this.myLeaves = leaves;
          this.leaveTypes = [...new Set(leaves.map(l => l.LeaveTypeName))]
            .filter(type => !/9p|leavsetype/i.test(type)); // Exclude invalid leave types
          console.log('Leave Types:', this.leaveTypes); // Debug: Log filtered leave types
          this.applyFilter();
        },
        error: err => {
          const msg = err.error?.message ?? 'Failed to load leave history';
          this.snack.open(msg, 'OK', { duration: 3000 });
        }
      });
  }

  applyFilter(): void {
    this.filteredLeaves = this.myLeaves.filter(l => {
      const matchesType = this.selectedType ? l.LeaveTypeName === this.selectedType : true;
      const query = this.searchQuery.toLowerCase().trim();
      const matchesSearch = query
        ? l.LeaveTypeName.toLowerCase().includes(query) ||
          (l.Notes && l.Notes.toLowerCase().includes(query))
        : true;
      return matchesType && matchesSearch;
    });

    // Calculate leave count per day for data-leave-count
    const leaveCountByDay: { [key: string]: number } = {};
    this.filteredLeaves.forEach(leave => {
      const start = new Date(leave.fDate);
      const end = new Date(leave.tDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().split('T')[0];
        leaveCountByDay[dateKey] = (leaveCountByDay[dateKey] || 0) + 1;
      }
    });

    this.calendarOptions.events = this.filteredLeaves.map(leave => {
      const leaveTypeName = leave.LeaveTypeName.replace(/9p\s*|leavsetype\s*/gi, '').trim() || 'Unknown'; // Enhanced sanitization
      const status = leave.Approved.toLowerCase(); // Use lowercase status
      console.log('Processing Leave:', leave.ID, 'Raw LeaveTypeName:', leave.LeaveTypeName, 'Sanitized:', leaveTypeName, 'Status:', status); // Debug: Log sanitization and status
      const event: CustomEventInput = {
        id: leave.ID.toString(),
        title: `Your leave is ${status}: Click to view details for leave: ${leaveTypeName}`, // Updated title format with status
        start: new Date(leave.fDate),
        end: new Date(new Date(leave.tDate).setDate(new Date(leave.tDate).getDate() + 1)),
        color: this.getLeaveColor(leave.Approved),
        extendedProps: { status: leave.Approved }
      };
      const dateKey = new Date(leave.fDate).toISOString().split('T')[0];
      if (leaveCountByDay[dateKey]) {
        event['data-leave-count'] = leaveCountByDay[dateKey].toString();
      }
      return event;
    });
  }

  /* ─────── Date Constraints ─────── */
  fromDateFilter = (date: Date | null): boolean => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (
      date >= today &&
      date.getFullYear() === today.getFullYear()
    );
  };

  sameYearFilter = (date: Date | null): boolean => {
    const from = this.leaveForm?.value?.fDate;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!from || !date) return false;

    const fromDate = new Date(from);
    const selectedDate = new Date(date);
    const currentYear = today.getFullYear();

    return (
      selectedDate >= fromDate &&
      selectedDate.getFullYear() === currentYear &&
      fromDate.getFullYear() === currentYear
    );
  };

  onFromDateChange(event: any): void {
    const selected = event.value;
    const currentTo = this.leaveForm.value.tDate;
    if (currentTo && new Date(currentTo) < new Date(selected)) {
      this.leaveForm.patchValue({ tDate: null });
    }
  }
}