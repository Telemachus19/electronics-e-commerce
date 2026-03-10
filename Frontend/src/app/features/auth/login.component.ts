import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly infoMessage = signal('');

  protected readonly loginForm = this.fb.nonNullable.group({
    identifier: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  constructor() {
    const registered = this.route.snapshot.queryParamMap.get('registered');
    if (registered === 'true') {
      this.infoMessage.set('Account created. Ask admin for approval, then sign in.');
    }
  }

  protected onSubmit(): void {
    if (this.loginForm.invalid || this.isSubmitting()) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set('');
    this.isSubmitting.set(true);

    this.authService.login(this.loginForm.getRawValue()).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

        if (returnUrl) {
          this.router.navigateByUrl(returnUrl);
          return;
        }

        this.router.navigate(['/']);
      },
      error: (error: { error?: { message?: string } }) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(error.error?.message ?? 'Failed to login.');
      },
    });
  }
}
