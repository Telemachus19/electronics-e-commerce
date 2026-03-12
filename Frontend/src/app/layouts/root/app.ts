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

  protected readonly cartItemCount = this.cartService.cartItemCount;
  protected readonly searchTerm = signal('');

  protected readonly isAuthenticated = this.authService.isAuthenticated;
  protected readonly role = computed(() => this.authService.role() ?? 'guest');
  protected readonly menuOpen = signal(false);

  constructor() {
    effect(() => {
      if (!this.isAuthenticated()) {
        this.cartService.clearCount();
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
        this.closeMenu();

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
    this.closeMenu();
    void this.router.navigate(['/products'], {
      queryParams: query ? { q: query } : {},
    });
  }

  protected toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected logout(): void {
    this.authService.logout().subscribe();
    this.closeMenu();
  }

  private refreshCartCount(): void {
    this.cartService.getCart().subscribe({ error: () => {} });
  }
}
