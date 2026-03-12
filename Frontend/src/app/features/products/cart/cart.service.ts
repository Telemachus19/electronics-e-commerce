import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';

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

interface GuestCartEntry {
  productId: string;
  name: string;
  price: number;
  imageUrl?: string;
  quantity: number;
}

const GUEST_CART_KEY = 'electronics_guest_cart';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly cartApiUrl = '/api/cart';

  private readonly _cartCount = signal(0);
  readonly cartItemCount = this._cartCount.asReadonly();

  getCart(): Observable<{ data: Cart | { items: CartItem[] } }> {
    if (!this.authService.isAuthenticated()) {
      const items = this.getGuestCartItems();
      this._updateCount(items);
      return of({ data: { items } });
    }

    return this.http.get<{ data: Cart | { items: CartItem[] } }>(this.cartApiUrl).pipe(
      tap({
        next: (r) => this._updateCount((r.data as Cart).items || []),
        error: () => this._cartCount.set(0),
      }),
    );
  }

  addToCart(
    productId: string,
    quantity: number,
    productInfo?: { name: string; price: number; imageUrl?: string },
  ) {
    if (!this.authService.isAuthenticated()) {
      this.addToGuestCart(productId, quantity, productInfo);
      const items = this.getGuestCartItems();
      this._updateCount(items);
      return of({ data: { items } as unknown as Cart });
    }

    return this.http
      .post<{ data: Cart }>(this.cartApiUrl, { productId, quantity })
      .pipe(tap({ next: (r) => this._updateCount(r.data.items || []) }));
  }

  removeFromCart(productId: string) {
    if (!this.authService.isAuthenticated()) {
      this.removeFromGuestCart(productId);
      const items = this.getGuestCartItems();
      this._updateCount(items);
      return of({ data: { items } as unknown as Cart });
    }

    return this.http
      .delete<{ data: Cart }>(`${this.cartApiUrl}/${productId}`)
      .pipe(tap({ next: (r) => this._updateCount(r.data.items || []) }));
  }

  getGuestCartEntries(): GuestCartEntry[] {
    try {
      const raw = localStorage.getItem(GUEST_CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  clearGuestCart(): void {
    localStorage.removeItem(GUEST_CART_KEY);
  }

  initCount(): void {
    if (this.authService.isAuthenticated()) {
      this.getCart().subscribe();
    } else {
      this._updateCount(this.getGuestCartItems());
    }
  }

  private getGuestCartItems(): CartItem[] {
    return this.getGuestCartEntries().map((e) => ({
      product: { _id: e.productId, name: e.name, price: e.price, imageUrl: e.imageUrl },
      quantity: e.quantity,
    }));
  }

  private addToGuestCart(
    productId: string,
    quantity: number,
    info?: { name: string; price: number; imageUrl?: string },
  ): void {
    const entries = this.getGuestCartEntries();
    const existing = entries.find((e) => e.productId === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      entries.push({
        productId,
        name: info?.name || 'Product',
        price: info?.price || 0,
        imageUrl: info?.imageUrl,
        quantity,
      });
    }
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(entries));
  }

  private removeFromGuestCart(productId: string): void {
    const entries = this.getGuestCartEntries().filter((e) => e.productId !== productId);
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(entries));
  }

  private _updateCount(items: CartItem[]): void {
    this._cartCount.set(items.reduce((sum, item) => sum + item.quantity, 0));
  }

  clearCount(): void {
    this._cartCount.set(0);
  }
}
