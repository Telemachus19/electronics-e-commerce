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

interface LoginResponse {
  message: string;
  token: string;
  user: AuthUser;
}

interface RegisterResponse {
  message: string;
  token?: string;
  user?: AuthUser;
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

  readonly isAuthenticated = computed(() => !!this.tokenState());
  readonly role = computed(() => this.roleState());

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
    phone: string;
    password: string;
  }): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.authApiUrl}/register`, payload);
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
