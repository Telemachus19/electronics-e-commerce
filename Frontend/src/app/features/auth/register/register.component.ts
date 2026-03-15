import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly phonePattern = /^(?:\+20|20|0)?1[0125]\d{8}$/;
  private readonly optionalPhoneValidator = (
    control: AbstractControl<string>,
  ): ValidationErrors | null => {
    const value = control.value?.trim() ?? '';
    if (!value) {
      return null;
    }
    return this.phonePattern.test(value) ? null : { pattern: true };
  };

  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly returnUrl = signal<string | null>(
    this.route.snapshot.queryParamMap.get('returnUrl'),
  );

  protected readonly registerForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [this.optionalPhoneValidator]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected onSubmit(): void {
    if (this.registerForm.invalid || this.isSubmitting()) {
      this.registerForm.markAllAsTouched();
      if (this.registerForm.invalid) {
        this.errorMessage.set('Please complete all required fields correctly.');
      }
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');
    this.isSubmitting.set(true);

    const raw = this.registerForm.getRawValue();
    const payload = {
      firstName: raw.firstName.trim(),
      lastName: raw.lastName.trim(),
      email: raw.email.trim(),
      phone: raw.phone.trim() || undefined,
      password: raw.password,
    };

    this.authService.register(payload).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        this.successMessage.set(
          'Account created successfully. Please verify your email using the OTP.',
        );
        this.router.navigate(['/verify-user/otp'], {
          queryParams: {
            email: payload.email,
            registered: 'true',
            resendAvailableAt: response.resendAvailableAt,
            returnUrl: this.returnUrl() ?? undefined,
          },
        });
      },
      error: (error: { error?: { message?: string } }) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(error.error?.message ?? 'Failed to register.');
      },
    });
  }
}
