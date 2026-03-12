import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChildren,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { interval, startWith, timer } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';

const OTP_CONTROL_NAMES = ['digit0', 'digit1', 'digit2', 'digit3', 'digit4', 'digit5'] as const;

type OtpControlName = (typeof OTP_CONTROL_NAMES)[number];

@Component({
  selector: 'app-verify-otp',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './verify-otp.component.html',
  styleUrl: './verify-otp.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyOtpComponent {
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isSubmitting = signal(false);
  protected readonly isResending = signal(false);
  protected readonly isVerified = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly infoMessage = signal('');
  protected readonly resendMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly email = signal('');
  protected readonly otpControlNames = OTP_CONTROL_NAMES;
  protected readonly otpInputs = viewChildren<ElementRef<HTMLInputElement>>('otpInput');
  protected readonly currentTimestamp = signal(Date.now());
  protected readonly resendAvailableAt = signal(0);
  protected readonly remainingSeconds = computed(() => {
    const millisecondsRemaining = this.resendAvailableAt() - this.currentTimestamp();
    return Math.max(0, Math.ceil(millisecondsRemaining / 1000));
  });
  protected readonly resendCountdownLabel = computed(() => {
    const totalSeconds = this.remainingSeconds();
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  });
  protected readonly canResend = computed(
    () => this.remainingSeconds() === 0 && !this.isResending() && !this.isVerified(),
  );

  protected readonly otpForm = this.fb.nonNullable.group({
    digit0: ['', [Validators.required, Validators.pattern(/^\d$/)]],
    digit1: ['', [Validators.required, Validators.pattern(/^\d$/)]],
    digit2: ['', [Validators.required, Validators.pattern(/^\d$/)]],
    digit3: ['', [Validators.required, Validators.pattern(/^\d$/)]],
    digit4: ['', [Validators.required, Validators.pattern(/^\d$/)]],
    digit5: ['', [Validators.required, Validators.pattern(/^\d$/)]],
  });

  constructor() {
    interval(1000)
      .pipe(startWith(0), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.currentTimestamp.set(Date.now()));

    const emailFromQuery = this.route.snapshot.queryParamMap.get('email');
    if (!emailFromQuery) {
      void this.router.navigate(['/verify-user']);
      return;
    }

    this.email.set(emailFromQuery);

    const registered = this.route.snapshot.queryParamMap.get('registered');
    this.infoMessage.set(
      registered === 'true'
        ? 'Step 2 of 2: enter the verification code we sent to your email.'
        : 'Enter your 6-digit verification code to activate your account.',
    );

    const resendAvailableAt = this.route.snapshot.queryParamMap.get('resendAvailableAt');
    this.resendAvailableAt.set(resendAvailableAt ? new Date(resendAvailableAt).getTime() : 0);
  }

  protected onDigitInput(controlName: OtpControlName, index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const nextValue = input.value.replace(/\D/g, '').slice(-1);

    this.otpForm.controls[controlName].setValue(nextValue);
    input.value = nextValue;

    if (nextValue && index < this.otpControlNames.length - 1) {
      this.focusInput(index + 1);
    }
  }

  protected onDigitKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace') {
      const controlName = this.otpControlNames[index];
      if (!this.otpForm.controls[controlName].value && index > 0) {
        this.focusInput(index - 1);
      }
      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      this.focusInput(index - 1);
      return;
    }

    if (event.key === 'ArrowRight' && index < this.otpControlNames.length - 1) {
      event.preventDefault();
      this.focusInput(index + 1);
    }
  }

  protected onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();

    const pastedDigits = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6) ?? '';
    if (!pastedDigits) {
      return;
    }

    this.otpControlNames.forEach((controlName, index) => {
      this.otpForm.controls[controlName].setValue(pastedDigits[index] ?? '');
    });

    const nextIndex = Math.min(pastedDigits.length, this.otpControlNames.length - 1);
    this.focusInput(nextIndex);
  }

  protected onSubmit(): void {
    if (this.otpForm.invalid || this.isSubmitting() || this.isVerified()) {
      this.otpForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set('');
    this.resendMessage.set('');
    this.isSubmitting.set(true);

    this.authService.verifyEmail({
      email: this.email(),
      otp: this.otpControlNames.map((controlName) => this.otpForm.controls[controlName].value).join(''),
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.isVerified.set(true);
        this.successMessage.set('Email verified successfully. Redirecting to the home page...');
        timer(1800)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => this.router.navigate(['/']));
      },
      error: (error: { error?: { message?: string } }) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(error.error?.message ?? 'Failed to verify account.');
      },
    });
  }

  protected resendVerificationEmail(): void {
    if (!this.canResend()) {
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');
    this.resendMessage.set('');
    this.isResending.set(true);

    this.authService.resendVerificationEmail({ email: this.email() }).subscribe({
      next: (response) => {
        this.isResending.set(false);
        this.resendMessage.set(response.message);
        this.resendAvailableAt.set(new Date(response.resendAvailableAt).getTime());
        this.otpForm.reset();
        this.focusInput(0);
      },
      error: (error: { error?: { message?: string; resendAvailableAt?: string } }) => {
        this.isResending.set(false);
        const availableAt = error.error?.resendAvailableAt;
        if (availableAt) {
          this.resendAvailableAt.set(new Date(availableAt).getTime());
        }
        this.errorMessage.set(error.error?.message ?? 'Failed to resend verification email.');
      },
    });
  }

  private focusInput(index: number): void {
    const input = this.otpInputs()[index]?.nativeElement;
    input?.focus();
    input?.select();
  }
}
