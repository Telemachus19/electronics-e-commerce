import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

interface CartItemProduct {
  _id: string;
  name: string;
  price: number;
  imageUrl?: string;
}

export interface CartItem {
  product: CartItemProduct;
  quantity: number;
}

export interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly cartApiUrl = '/api/cart';

  private readonly _cartCount = signal(0);
  readonly cartItemCount = this._cartCount.asReadonly();

  getCart() {
    return this.http.get<{ data: Cart | { items: CartItem[] } }>(this.cartApiUrl).pipe(
      tap({
        next: (r) => this._updateCount((r.data as Cart).items || []),
        error: () => this._cartCount.set(0),
      }),
    );
  }

  addToCart(productId: string, quantity: number) {
    return this.http
      .post<{ data: Cart }>(this.cartApiUrl, { productId, quantity })
      .pipe(tap({ next: (r) => this._updateCount(r.data.items || []) }));
  }

  removeFromCart(productId: string) {
    return this.http
      .delete<{ data: Cart }>(`${this.cartApiUrl}/${productId}`)
      .pipe(tap({ next: (r) => this._updateCount(r.data.items || []) }));
  }

  private _updateCount(items: CartItem[]): void {
    this._cartCount.set(items.reduce((sum, item) => sum + item.quantity, 0));
  }

  clearCount(): void {
    this._cartCount.set(0);
  }
}
