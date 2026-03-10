import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly authService = inject(AuthService);

  protected readonly isAuthenticated = this.authService.isAuthenticated;
  protected readonly role = computed(() => this.authService.role() ?? 'guest');

  protected logout(): void {
    this.authService.logout().subscribe();
  }
}
