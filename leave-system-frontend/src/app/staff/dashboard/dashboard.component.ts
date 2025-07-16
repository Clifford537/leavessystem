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

import {
  LeaveService,
  LeaveBalance,
  LeaveTransaction,
  CreateLeaveDto
} from '../../core/services/leave.service';

import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
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
    MatNativeDateModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  @ViewChild('leaveDialog') leaveDialog!: TemplateRef<unknown>;
  @ViewChild('balancesDialog') balancesDialog!: TemplateRef<unknown>;
  private dialogRef?: MatDialogRef<unknown>;

  leaveForm!: FormGroup;
  balances: LeaveBalance[] = [];
  myLeaves: LeaveTransaction[] = [];
  filteredLeaves: LeaveTransaction[] = [];

  leaveTypes: string[] = [];
  selectedType: string = '';

  loading = false;
  readonly MIN_SPIN_MS = 2000;
  errorMsg: string | null = null;

  constructor(
    private fb: FormBuilder,
    private leaveSvc: LeaveService,
    private snack: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.leaveForm = this.fb.group({
      LeaveTypeID: [null, Validators.required],
      fDate:       [null, Validators.required],
      tDate:       [null, Validators.required],
      Notes:       ['']
    });

    this.refresh();
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
          this.snack.open(res.message, 'OK', { duration: 2500 });
          this.dialogRef?.close();
          this.refresh();
        },
        error: err => {
          this.errorMsg =
            err.status === 409
              ? err.error?.message ?? 'Insufficient balance'
              : err.error?.message ?? 'Request failed';
        }
      });
  }

  /* ─────── Refresh & Filter ─────── */
  private refresh(): void {
    this.leaveSvc.getBalances().subscribe(b => (this.balances = b));
    this.leaveSvc.getMyLeaves().subscribe(leaves => {
      this.myLeaves = leaves;
      this.leaveTypes = [...new Set(leaves.map(l => l.LeaveTypeName))];
      this.applyFilter();
    });
  }

  applyFilter(): void {
    this.filteredLeaves = this.selectedType
      ? this.myLeaves.filter(l => l.LeaveTypeName === this.selectedType)
      : this.myLeaves;
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
