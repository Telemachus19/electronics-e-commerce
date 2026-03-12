import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartItem, CartService } from './cart.service';
import { OrdersService } from './orders.service';

type CheckoutStep = 'shipping' | 'payment' | 'confirm';

@Component({
  selector: 'app-checkout',
  imports: [RouterLink, DecimalPipe, FormsModule],
  templateUrl: './checkout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutComponent implements OnInit {
  private readonly cartService = inject(CartService);
  private readonly ordersService = inject(OrdersService);
  private readonly router = inject(Router);

  protected readonly step = signal<CheckoutStep>('shipping');
  protected readonly cartItems = signal<CartItem[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly isPlacingOrder = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly orderSuccess = signal(false);
  protected readonly placedOrderId = signal<string | null>(null);

  // Form fields
  protected readonly shippingAddress = signal('');
  protected readonly paymentMethod = signal<'cod' | 'card'>('cod');

  protected readonly subtotal = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.product.price * item.quantity, 0),
  );

  protected readonly estimatedShipping = computed(() => (this.subtotal() >= 300 ? 0 : 14.99));
  protected readonly estimatedTax = computed(() => this.subtotal() * 0.08);
  protected readonly orderTotal = computed(
    () => this.subtotal() + this.estimatedShipping() + this.estimatedTax(),
  );

  protected readonly totalItems = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.quantity, 0),
  );

  protected readonly isShippingValid = computed(() => this.shippingAddress().trim().length >= 10);

  private readonly steps: CheckoutStep[] = ['shipping', 'payment', 'confirm'];

  protected stepIndex(s: string): number {
    return this.steps.indexOf(s as CheckoutStep);
  }

  ngOnInit(): void {
    this.loadCart();
  }

  protected goToStep(newStep: CheckoutStep): void {
    this.error.set(null);
    this.step.set(newStep);
  }

  protected proceedToPayment(): void {
    if (!this.isShippingValid()) {
      this.error.set('Please enter a valid shipping address (at least 10 characters).');
      return;
    }
    this.goToStep('payment');
  }

  protected proceedToConfirm(): void {
    this.goToStep('confirm');
  }

  protected placeOrder(): void {
    this.isPlacingOrder.set(true);
    this.error.set(null);

    this.ordersService
      .createOrder({
        shippingAddress: this.shippingAddress().trim(),
        paymentMethod: this.paymentMethod(),
      })
      .subscribe({
        next: (response) => {
          if (response.stripeUrl) {
            window.location.href = response.stripeUrl;
            return;
          }

          this.placedOrderId.set(response.data._id);
          this.orderSuccess.set(true);
          this.isPlacingOrder.set(false);
          this.cartService.clearCount();
        },
        error: (err: { error?: { message?: string } }) => {
          this.error.set(err?.error?.message || 'Failed to place order. Please try again.');
          this.isPlacingOrder.set(false);
        },
      });
  }

  private loadCart(): void {
    this.isLoading.set(true);
    this.cartService.getCart().subscribe({
      next: (response) => {
        this.cartItems.set(response.data.items || []);
        this.isLoading.set(false);

        if ((response.data.items || []).length === 0) {
          this.error.set('Your cart is empty. Add some products first.');
        }
      },
      error: () => {
        this.error.set('Failed to load cart.');
        this.isLoading.set(false);
      },
    });
  }
}
