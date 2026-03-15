import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OrdersService } from './orders.service';

@Component({
  selector: 'app-checkout-success',
  imports: [RouterLink],
  template: `
    <section class="min-h-screen bg-[#f5f7fb] py-10">
      <div
        class="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm"
      >
        @if (isVerifying()) {
          <div
            class="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"
          ></div>
          <h1 class="mt-5 text-2xl font-bold text-slate-900">Verifying payment...</h1>
          <p class="mt-2 text-sm text-slate-600">
            Please wait while we confirm your Stripe payment.
          </p>
        } @else if (error()) {
          <h1 class="text-2xl font-bold text-rose-700">Payment verification failed</h1>
          <p class="mt-2 text-sm text-slate-600">{{ error() }}</p>
          <div class="mt-5 flex items-center justify-center gap-3">
            <a
              routerLink="/orders"
              class="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              Go to Orders
            </a>
            <a
              routerLink="/checkout"
              class="inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Back to Checkout
            </a>
          </div>
        } @else {
          <h1 class="text-2xl font-bold text-emerald-700">Payment successful</h1>
          <p class="mt-2 text-sm text-slate-600">
            Your payment was confirmed and order status has been updated.
          </p>
          @if (verifiedOrderId()) {
            <p class="mt-1 text-xs text-slate-500">Redirecting to order details...</p>
          }
          <div class="mt-5">
            <a
              [routerLink]="verifiedOrderId() ? ['/orders', verifiedOrderId()] : ['/orders']"
              class="inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              View Order
            </a>
          </div>
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutSuccessComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ordersService = inject(OrdersService);

  protected readonly isVerifying = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly verifiedOrderId = signal<string | null>(null);

  ngOnInit(): void {
    const sessionId = this.route.snapshot.queryParamMap.get('session_id')?.trim();

    if (!sessionId) {
      this.error.set('Missing Stripe session id.');
      this.isVerifying.set(false);
      return;
    }

    this.ordersService.verifyStripePayment(sessionId).subscribe({
      next: (response) => {
        this.verifiedOrderId.set(response.data?._id ?? null);
        this.isVerifying.set(false);

        if (response.data?._id) {
          setTimeout(() => {
            void this.router.navigate(['/orders', response.data!._id]);
          }, 1200);
        }
      },
      error: (err: { error?: { message?: string } }) => {
        this.error.set(err?.error?.message || 'Payment verification failed.');
        this.isVerifying.set(false);
      },
    });
  }
}
