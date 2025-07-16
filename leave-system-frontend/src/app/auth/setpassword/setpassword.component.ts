import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-setpassword',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './setpassword.component.html',
  styleUrls: ['./setpassword.component.scss']
})
export class SetpasswordComponent {
  verifyForm: FormGroup;
  passwordForm: FormGroup;
  step = 1;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.verifyForm = this.fb.group({
      idno: ['', Validators.required],
      staffno: ['', Validators.required]
    });

    this.passwordForm = this.fb.group({
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/)
        ]
      ],
      confirmPassword: ['', Validators.required]
    });
  }

  async verifyUser() {
    if (this.verifyForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    try {
      const response = await this.authService.verifyUser(this.verifyForm.value);
      this.step = 2;
    } catch (error: any) {
      this.errorMessage = error?.error?.message || 'Verification failed.';
    } finally {
      this.loading = false;
    }
  }

  async setPassword() {
    if (this.passwordForm.invalid) return;

    const password = this.passwordForm.value.password;
    const confirmPassword = this.passwordForm.value.confirmPassword;

    if (password !== confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const data = {
        ...this.verifyForm.value,
        password: this.passwordForm.value.password
      };
      const response = await this.authService.setPassword(data);
      this.successMessage = response.message;
      setTimeout(() => this.router.navigate(['/login']), 2000);
    } catch (error: any) {
      this.errorMessage = error?.error?.message || 'Failed to set password.';
    } finally {
      this.loading = false;
    }
  }
}
