import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Order, OrdersService } from '../orders.service';

@Component({
  selector: 'app-order-detail',
  imports: [RouterLink, DecimalPipe, DatePipe],
  templateUrl: './order-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderDetailComponent implements OnInit {
  private readonly ordersService = inject(OrdersService);
  private readonly route = inject(ActivatedRoute);

  protected readonly order = signal<Order | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly subtotal = computed(
    () => this.order()?.items.reduce((s, i) => s + i.price * i.quantity, 0) ?? 0,
  );

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.ordersService.getOrderById(id).subscribe({
      next: (res) => {
        this.order.set(res.data);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Order not found or you do not have permission to view it.');
        this.isLoading.set(false);
      },
    });
  }

  protected statusClass(status: Order['status']): string {
    const map: Record<Order['status'], string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      processing: 'bg-blue-100 text-blue-700',
      shipped: 'bg-indigo-100 text-indigo-700',
      delivered: 'bg-emerald-100 text-emerald-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return map[status] ?? 'bg-slate-100 text-slate-700';
  }

  protected paymentClass(status: Order['paymentStatus']): string {
    const map: Record<Order['paymentStatus'], string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      paid: 'bg-emerald-100 text-emerald-700',
      failed: 'bg-red-100 text-red-700',
    };
    return map[status] ?? 'bg-slate-100 text-slate-700';
  }
}
