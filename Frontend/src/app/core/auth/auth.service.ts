import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, Observable, of, tap } from 'rxjs';

interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  isEmailVerified: boolean;
}

interface LoginResponse {
  message: string;
  token: string;
  user: AuthUser;
}

interface RegisterResponse {
  message: string;
  resendAvailableAt?: string;
  token?: string;
  user?: AuthUser;
}

interface ResendVerificationResponse {
  message: string;
  resendAvailableAt: string;
}

interface VerifyEmailResponse {
  message: string;
  token: string;
  user: AuthUser;
}

interface GetUserProfileResponse {
  data: UserProfile;
}

interface UpdateProfileResponse {
  message: string;
  data: UserProfile;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly authApiUrl = '/api/auth';
  private readonly tokenStorageKey = 'electronics_token';

  private readonly tokenState = signal<string | null>(localStorage.getItem(this.tokenStorageKey));
  private readonly roleState = signal<string | null>(this.extractRole(this.tokenState()));
  private readonly userProfileState = signal<UserProfile | null>(null);

  readonly isAuthenticated = computed(() => !!this.tokenState());
  readonly role = computed(() => this.roleState());
  readonly userProfile = computed(() => this.userProfileState());

  getToken(): string | null {
    return this.tokenState();
  }

  login(payload: { identifier: string; password: string }): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.authApiUrl}/login`, payload)
      .pipe(tap((response) => this.persistSession(response.token, response.user.role)));
  }

  register(payload: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password: string;
  }): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.authApiUrl}/register`, payload);
  }

  resendVerificationEmail(payload: { email: string }): Observable<ResendVerificationResponse> {
    return this.http.post<ResendVerificationResponse>(
      `${this.authApiUrl}/resend-verification-email`,
      payload,
    );
  }

  verifyEmail(payload: { email: string; otp: string }): Observable<VerifyEmailResponse> {
    return this.http
      .post<VerifyEmailResponse>(`${this.authApiUrl}/verify-email`, payload)
      .pipe(tap((response) => this.persistSession(response.token, response.user.role)));
  }

  getCurrentUser(): Observable<GetUserProfileResponse> {
    return this.http
      .get<GetUserProfileResponse>(`${this.authApiUrl}/me`)
      .pipe(tap((response) => this.userProfileState.set(response.data)));
  }

  updateProfile(payload: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  }): Observable<UpdateProfileResponse> {
    return this.http
      .put<UpdateProfileResponse>(`${this.authApiUrl}/me`, payload)
      .pipe(tap((response) => this.userProfileState.set(response.data)));
  }

  logout() {
    return this.http.post<{ message: string }>(`${this.authApiUrl}/logout`, {}).pipe(
      catchError(() => of({ message: 'Logout fallback' })),
      tap(() => {
        this.clearSession();
        this.router.navigate(['/login']);
      }),
    );
  }

  clearSession(): void {
    this.tokenState.set(null);
    this.roleState.set(null);
    this.userProfileState.set(null);
    localStorage.removeItem(this.tokenStorageKey);
  }

  private persistSession(token: string, role: string): void {
    this.tokenState.set(token);
    this.roleState.set(role);
    localStorage.setItem(this.tokenStorageKey, token);
  }

  private extractRole(token: string | null): string | null {
    if (!token) {
      return null;
    }

    try {
      const [, payload] = token.split('.');
      if (!payload) {
        return null;
      }

      const parsedPayload = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      return typeof parsedPayload.role === 'string' ? parsedPayload.role : null;
    } catch {
      return null;
    }
  }
}
