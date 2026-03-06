import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageUrl?: string;
  isActive: boolean;
  ratingAverage?: number;
  ratingCount?: number;
  reviews?: Review[];
}

export interface Review {
  _id: string;
  product: string;
  user: { _id: string; firstName: string; lastName: string };
  rating: number;
  comment?: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private readonly http = inject(HttpClient);
  private readonly productsApiUrl = '/api/products';

  getProducts() {
    return this.http.get<{ data: Product[] }>(this.productsApiUrl);
  }

  getProductById(id: string) {
    return this.http.get<{ data: Product }>(`${this.productsApiUrl}/${id}`);
  }

  createProduct(product: Omit<Product, '_id'>) {
    return this.http.post<{ data: Product }>(this.productsApiUrl, product);
  }

  getReviewsByProduct(productId: string) {
    return this.http.get<{ data: Review[] }>(
      `${this.productsApiUrl}/${productId}/reviews`
    );
  }

  createReview(productId: string, review: { userId: string; rating: number; comment?: string }) {
    return this.http.post<{ data: Review }>(
      `${this.productsApiUrl}/${productId}/reviews`,
      review
    );
  }
}
