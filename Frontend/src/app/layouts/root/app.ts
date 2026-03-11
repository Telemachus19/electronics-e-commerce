import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/auth/auth.service';
import { CartService } from '../../features/products/cart.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly authService = inject(AuthService);
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly cartItemCount = signal(0);
  protected readonly searchTerm = signal('');

  protected readonly isAuthenticated = this.authService.isAuthenticated;
  protected readonly role = computed(() => this.authService.role() ?? 'guest');

  constructor() {
    effect(() => {
      if (!this.isAuthenticated()) {
        this.cartItemCount.set(0);
        return;
      }
      this.refreshCartCount();
    });

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        const queryValue = this.router.parseUrl(this.router.url).queryParams['q'];
        this.searchTerm.set(typeof queryValue === 'string' ? queryValue : '');

        if (this.isAuthenticated()) {
          this.refreshCartCount();
        }
      });
  }

  protected onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  protected onSearchSubmit(): void {
    const query = this.searchTerm().trim();
    void this.router.navigate(['/products'], {
      queryParams: query ? { q: query } : {},
    });
  }

  protected logout(): void {
    this.authService.logout().subscribe();
  }

  private refreshCartCount(): void {
    this.cartService.getCart().subscribe({
      next: (response) => {
        const items = response.data.items || [];
        const total = items.reduce((sum, item) => sum + item.quantity, 0);
        this.cartItemCount.set(total);
      },
      error: () => {
        this.cartItemCount.set(0);
      },
    });
  }
}
