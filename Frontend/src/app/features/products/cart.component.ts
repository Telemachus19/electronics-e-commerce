import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartItem, CartService } from './cart.service';

type CartState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-cart',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartComponent implements OnInit {
  private readonly cartService = inject(CartService);

  protected readonly state = signal<CartState>('loading');
  protected readonly error = signal<string | null>(null);
  protected readonly cartItems = signal<CartItem[]>([]);
  protected readonly removingProductId = signal<string | null>(null);

  protected readonly totalItems = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.quantity, 0),
  );

  protected readonly subtotal = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.product.price * item.quantity, 0),
  );

  protected readonly estimatedShipping = computed(() => (this.subtotal() >= 300 ? 0 : 14.99));
  protected readonly estimatedTax = computed(() => this.subtotal() * 0.08);
  protected readonly orderTotal = computed(
    () => this.subtotal() + this.estimatedShipping() + this.estimatedTax(),
  );

  ngOnInit(): void {
    this.loadCart();
  }

  protected removeItem(productId: string): void {
    this.removingProductId.set(productId);

    this.cartService.removeFromCart(productId).subscribe({
      next: (response) => {
        this.cartItems.set(response.data.items || []);
        this.removingProductId.set(null);
      },
      error: (error: { error?: { message?: string } }) => {
        this.error.set(error?.error?.message || 'Failed to remove item from cart');
        this.removingProductId.set(null);
      },
    });
  }

  protected addOneMore(productId: string): void {
    this.cartService.addToCart(productId, 1).subscribe({
      next: (response) => {
        this.cartItems.set(response.data.items || []);
      },
      error: (error: { error?: { message?: string } }) => {
        this.error.set(error?.error?.message || 'Failed to update quantity');
      },
    });
  }

  private loadCart(): void {
    this.state.set('loading');
    this.error.set(null);

    this.cartService.getCart().subscribe({
      next: (response) => {
        this.cartItems.set(response.data.items || []);
        this.state.set('ready');
      },
      error: (error: { error?: { message?: string } }) => {
        this.error.set(error?.error?.message || 'Failed to load cart');
        this.state.set('error');
      },
    });
  }
}
