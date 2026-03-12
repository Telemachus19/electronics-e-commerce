import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WishlistService } from './wishlist.service';

@Component({
  selector: 'app-wishlist',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishlistComponent {
  private readonly wishlistService = inject(WishlistService);

  protected readonly wishlistItems = this.wishlistService.items;
  protected readonly hasItems = computed(() => this.wishlistItems().length > 0);

  protected removeItem(productId: string): void {
    this.wishlistService.remove(productId);
  }

  protected clearWishlist(): void {
    this.wishlistService.clear();
  }

  protected productImage(url?: string): string {
    return (
      url ||
      'https://images.unsplash.com/photo-1468495244123-6c6f5f5b7f1d?w=640&q=80&auto=format&fit=crop'
    );
  }
}
