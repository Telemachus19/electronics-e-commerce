import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-verify-user',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './verify-user.component.html',
  styleUrl: './verify-user.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyUserComponent {
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly infoMessage = signal('');

  protected readonly emailForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  constructor() {
    const emailFromQuery = this.route.snapshot.queryParamMap.get('email');
    if (emailFromQuery) {
      this.emailForm.controls.email.setValue(emailFromQuery);
    }

    const registered = this.route.snapshot.queryParamMap.get('registered');
    this.infoMessage.set(
      registered === 'true'
        ? 'We sent a verification code to your email. Continue to enter the OTP.'
        : 'Enter the email address linked to your account to continue verification.',
    );
  }

  protected onSubmit(): void {
    if (this.emailForm.invalid || this.isSubmitting()) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set('');
    this.isSubmitting.set(true);

    this.authService.resendVerificationEmail({ email: this.emailForm.controls.email.value }).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        this.router.navigate(['/verify-user/otp'], {
          queryParams: {
            email: this.emailForm.controls.email.value,
            registered: this.route.snapshot.queryParamMap.get('registered') ?? 'false',
            resendAvailableAt: response.resendAvailableAt,
          },
        });
      },
      error: (error: { error?: { message?: string } }) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(error.error?.message ?? 'Failed to send verification code.');
      },
    });
  }
}
