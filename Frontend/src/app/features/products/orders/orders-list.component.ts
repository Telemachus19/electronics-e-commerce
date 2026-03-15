import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Order, OrdersService } from '../orders.service';
import { CartService } from '../cart/cart.service';

@Component({
  selector: 'app-orders-list',
  imports: [RouterLink, DecimalPipe, DatePipe],
  templateUrl: './orders-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersListComponent implements OnInit {
  private readonly ordersService = inject(OrdersService);
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);

  protected readonly orders = signal<Order[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly buyingAgainKey = signal<string | null>(null);

  ngOnInit(): void {
    this.ordersService.getOrders().subscribe({
      next: (res) => {
        this.orders.set(res.data);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Failed to load orders.');
        this.isLoading.set(false);
      },
    });
  }

  protected statusClass(status: Order['status']): string {
    const map: Record<Order['status'], string> = {
      pending: 'bg-slate-100 text-slate-700',
      processing: 'bg-blue-100 text-blue-700',
      shipped: 'bg-cyan-100 text-cyan-700',
      delivered: 'bg-emerald-100 text-emerald-700',
      cancelled: 'bg-rose-100 text-rose-700',
    };
    return map[status] ?? 'bg-slate-100 text-slate-700';
  }

  protected paymentClass(status: Order['paymentStatus']): string {
    const map: Record<Order['paymentStatus'], string> = {
      pending: 'bg-blue-100 text-blue-700',
      paid: 'bg-emerald-100 text-emerald-700',
      failed: 'bg-rose-100 text-rose-700',
    };
    return map[status] ?? 'bg-slate-100 text-slate-700';
  }

  protected shipToName(order: Order): string {
    if (!order.user) {
      return 'Customer';
    }

    if (typeof order.user === 'string') {
      return 'Customer';
    }

    const firstName = order.user.firstName?.trim() ?? '';
    const lastName = order.user.lastName?.trim() ?? '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || order.user.email || 'Customer';
  }

  protected statusTitle(order: Order): string {
    switch (order.status) {
      case 'delivered':
        return 'Delivered';
      case 'shipped':
        return 'Shipped';
      case 'processing':
        return 'Preparing your order';
      case 'cancelled':
        return 'Order cancelled';
      default:
        return 'Order placed';
    }
  }

  protected statusMessage(order: Order): string {
    switch (order.status) {
      case 'delivered':
        return 'Your package was delivered successfully.';
      case 'shipped':
        return 'Your package is on the way.';
      case 'processing':
        return 'We are preparing your order for shipment.';
      case 'cancelled':
        return 'This order was cancelled.';
      default:
        return 'We received your order and will process it shortly.';
    }
  }

  protected paymentLabel(order: Order): string {
    if (order.paymentStatus === 'paid') {
      return 'Payment completed';
    }

    if (order.paymentStatus === 'failed') {
      return 'Payment failed. Please retry payment from order details.';
    }

    return order.paymentMethod === 'cod'
      ? 'Payment due on delivery'
      : 'Payment pending confirmation';
  }

  protected orderStatusLabel(status: Order['status']): string {
    const map: Record<Order['status'], string> = {
      pending: 'Order: Awaiting confirmation',
      processing: 'Order: Being prepared',
      shipped: 'Order: Shipped',
      delivered: 'Order: Delivered',
      cancelled: 'Order: Cancelled',
    };
    return map[status] ?? 'Order: Status unavailable';
  }

  protected paymentStatusLabel(order: Order): string {
    if (order.paymentStatus === 'paid') {
      return 'Payment: Paid';
    }

    if (order.paymentStatus === 'failed') {
      return 'Payment: Failed';
    }

    return order.paymentMethod === 'cod'
      ? 'Payment: Cash on delivery'
      : 'Payment: Awaiting confirmation';
  }

  protected itemPreview(order: Order): string {
    const names = (order.items ?? []).map((item) => item.name).filter(Boolean);
    if (names.length === 0) {
      return 'No item details available';
    }

    if (names.length <= 2) {
      return names.join(', ');
    }

    return `${names.slice(0, 2).join(', ')} +${names.length - 2} more`;
  }

  protected totalUnits(order: Order): number {
    return (order.items ?? []).reduce((sum, item) => sum + item.quantity, 0);
  }

  protected displayOrderId(order: Order): string {
    return order._id || 'N/A';
  }

  protected displayOrderDate(order: Order): string {
    if (!order.createdAt) {
      return 'Date unavailable';
    }

    const date = new Date(order.createdAt);
    return Number.isNaN(date.getTime()) ? 'Date unavailable' : order.createdAt;
  }

  protected displayTotal(order: Order): number {
    return Number.isFinite(order.totalPrice) ? order.totalPrice : 0;
  }

  protected buyAgain(orderId: string, item: Order['items'][number]): void {
    const productId = String(item.product ?? '').trim();
    if (!productId || this.buyingAgainKey() !== null) {
      return;
    }

    const key = `${orderId}:${productId}`;
    this.error.set(null);
    this.buyingAgainKey.set(key);

    this.cartService
      .addToCart(productId, 1, {
        name: item.name,
        price: item.price,
        imageUrl: item.imageUrl,
      })
      .subscribe({
        next: () => {
          this.buyingAgainKey.set(null);
          void this.router.navigate(['/checkout']);
        },
        error: () => {
          this.buyingAgainKey.set(null);
          this.error.set('Could not add this item to cart. Please try again.');
        },
      });
  }

  protected isBuyingAgain(orderId: string, item: Order['items'][number]): boolean {
    const productId = String(item.product ?? '').trim();
    return this.buyingAgainKey() === `${orderId}:${productId}`;
  }
}
