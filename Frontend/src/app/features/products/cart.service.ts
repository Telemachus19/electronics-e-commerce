import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

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

  getCart() {
    return this.http.get<{ data: Cart | { items: CartItem[] } }>(this.cartApiUrl);
  }

  addToCart(productId: string, quantity: number) {
    return this.http.post<{ data: Cart }>(this.cartApiUrl, { productId, quantity });
  }

  removeFromCart(productId: string) {
    return this.http.delete<{ data: Cart }>(`${this.cartApiUrl}/${productId}`);
  }
}
