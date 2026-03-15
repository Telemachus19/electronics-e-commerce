import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface OrderItem {
  product: string;
  name: string;
  price: number;
  imageUrl?: string;
  quantity: number;
}

export interface Order {
  _id: string;
  user: string | { _id: string; firstName: string; lastName: string; email: string };
  items: OrderItem[];
  totalPrice: number;
  shippingAddress: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: 'cod' | 'card';
  paymentStatus: 'pending' | 'paid' | 'failed';
  stripeSessionId?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  private readonly http = inject(HttpClient);
  private readonly ordersApiUrl = '/api/orders';

  createOrder(payload: { shippingAddress: string; paymentMethod: 'cod' | 'card' }) {
    return this.http.post<{ data: Order; stripeUrl?: string }>(this.ordersApiUrl, payload);
  }

  createGuestOrder(payload: {
    shippingAddress: string;
    paymentMethod: 'cod' | 'card';
    guestName: string;
    guestEmail: string;
    items: Array<{ productId: string; quantity: number }>;
  }) {
    return this.http.post<{ data: Order; stripeUrl?: string }>(
      `${this.ordersApiUrl}/guest`,
      payload,
    );
  }

  verifyStripePayment(sessionId: string) {
    return this.http.post<{ message: string; data: Order | null }>(
      `${this.ordersApiUrl}/verify-payment`,
      { sessionId },
    );
  }

  getOrders() {
    return this.http.get<{ data: Order[] }>(this.ordersApiUrl);
  }

  getOrderById(id: string) {
    return this.http.get<{ data: Order }>(`${this.ordersApiUrl}/${id}`);
  }
}
