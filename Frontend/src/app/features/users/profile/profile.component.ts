import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  protected readonly isLoading = signal(true);
  protected readonly isEditing = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly userProfile = this.authService.userProfile;

  protected readonly form = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^(?:\+20|20|0)?1[0125]\d{8}$/)]],
  });

  ngOnInit(): void {
    this.loadUserProfile();
  }

  private loadUserProfile(): void {
    this.authService.getCurrentUser().subscribe({
      next: (response) => {
        this.form.patchValue({
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          email: response.data.email,
          phone: response.data.phone,
        });
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set('Failed to load profile');
        this.isLoading.set(false);
      },
    });
  }

  toggleEditMode(): void {
    this.isEditing.set(!this.isEditing());
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.isEditing()) {
      this.loadUserProfile();
    }
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const payload: { [key: string]: string } = {};
    const firstName = this.form.get('firstName')?.value;
    const lastName = this.form.get('lastName')?.value;
    const phone = this.form.get('phone')?.value;

    if (firstName) payload['firstName'] = firstName;
    if (lastName) payload['lastName'] = lastName;
    if (phone) payload['phone'] = phone;

    this.authService.updateProfile(payload).subscribe({
      next: () => {
        this.successMessage.set('Profile updated successfully');
        this.isSaving.set(false);
        this.isEditing.set(false);
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (error) => {
        this.isSaving.set(false);
        const errorMsg = error.error?.message || 'Failed to update profile';
        this.errorMessage.set(errorMsg);
      },
    });
  }

  cancel(): void {
    this.form.reset();
    this.isEditing.set(false);
    this.errorMessage.set('');
    this.loadUserProfile();
  }
}
