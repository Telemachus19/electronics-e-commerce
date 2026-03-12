import { computed, Injectable, signal } from '@angular/core';
import { Product } from '../products/products.service';

export interface WishlistItem {
  _id: string;
  name: string;
  price: number;
  category?: string;
  imageUrl?: string;
  stock?: number;
  slug?: string;
  addedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class WishlistService {
  private readonly storageKey = 'electronics_wishlist';
  private readonly itemsState = signal<WishlistItem[]>(this.readFromStorage());

  readonly items = this.itemsState.asReadonly();
  readonly wishlistCount = computed(() => this.itemsState().length);

  isInWishlist(productId: string): boolean {
    return this.itemsState().some((item) => item._id === productId);
  }

  add(product: Product): void {
    if (this.isInWishlist(product._id)) {
      return;
    }

    const item: WishlistItem = {
      _id: product._id,
      name: product.name,
      price: product.price,
      category: product.category,
      imageUrl: product.imageUrl,
      stock: product.stock,
      slug: product.slug,
      addedAt: new Date().toISOString(),
    };

    this.itemsState.update((items) => {
      const updated = [item, ...items];
      this.writeToStorage(updated);
      return updated;
    });
  }

  remove(productId: string): void {
    this.itemsState.update((items) => {
      const updated = items.filter((item) => item._id !== productId);
      this.writeToStorage(updated);
      return updated;
    });
  }

  toggle(product: Product): boolean {
    if (this.isInWishlist(product._id)) {
      this.remove(product._id);
      return false;
    }

    this.add(product);
    return true;
  }

  clear(): void {
    this.itemsState.set([]);
    localStorage.removeItem(this.storageKey);
  }

  private readFromStorage(): WishlistItem[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw) as WishlistItem[];
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.filter(
        (item) => typeof item?._id === 'string' && typeof item?.name === 'string',
      );
    } catch {
      return [];
    }
  }

  private writeToStorage(items: WishlistItem[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }
}
