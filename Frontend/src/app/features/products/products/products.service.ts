import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  category: string;
  categoryId?: { _id: string; name: string; slug: string; imageUrl?: string } | null;
  slug?: string;
  sku?: string;
  brand?: string;
  tags?: string[];
  imageUrl?: string;
  images?: Array<{ url: string; altText?: string; isPrimary?: boolean; order?: number }>;
  attributes?: Record<string, string>;
  owner?: string | { _id: string; firstName?: string; lastName?: string; email?: string } | null;
  isActive: boolean;
  ratingAverage?: number;
  ratingCount?: number;
  reviews?: Review[];
}

export interface ProductCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  productCount: number;
}

export interface ProductListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductListParams {
  category?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  sort?: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'featured';
  page?: number;
  limit?: number;
}

export interface Review {
  _id: string;
  product: string;
  user: { _id: string; firstName: string; lastName: string };
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface ProductUpsertPayload {
  name: string;
  description?: string;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  category?: string;
  slug?: string;
  sku?: string;
  brand?: string;
  imageUrl?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private readonly http = inject(HttpClient);
  private readonly productsApiUrl = '/api/products';
  private readonly categoriesApiUrl = '/api/categories';

  getProducts(params: ProductListParams = {}) {
    let httpParams = new HttpParams();

    if (params.category) httpParams = httpParams.set('category', params.category);
    if (params.q) httpParams = httpParams.set('q', params.q);
    if (params.sort) httpParams = httpParams.set('sort', params.sort);
    if (params.page != null) httpParams = httpParams.set('page', String(params.page));
    if (params.limit != null) httpParams = httpParams.set('limit', String(params.limit));
    if (params.minPrice != null) httpParams = httpParams.set('minPrice', String(params.minPrice));
    if (params.maxPrice != null) httpParams = httpParams.set('maxPrice', String(params.maxPrice));
    if (params.minRating != null)
      httpParams = httpParams.set('minRating', String(params.minRating));
    if (params.inStock != null) httpParams = httpParams.set('inStock', String(params.inStock));

    return this.http.get<{ data: Product[]; meta: ProductListMeta }>(this.productsApiUrl, {
      params: httpParams,
    });
  }

  getCategories() {
    return this.http.get<{ data: ProductCategory[] }>(this.categoriesApiUrl);
  }

  getProductById(id: string) {
    return this.http.get<{ data: Product }>(`${this.productsApiUrl}/${id}`);
  }

  getManagedProducts(params: ProductListParams = {}) {
    let httpParams = new HttpParams();

    if (params.category) httpParams = httpParams.set('category', params.category);
    if (params.q) httpParams = httpParams.set('q', params.q);
    if (params.sort) httpParams = httpParams.set('sort', params.sort);
    if (params.page != null) httpParams = httpParams.set('page', String(params.page));
    if (params.limit != null) httpParams = httpParams.set('limit', String(params.limit));
    if (params.minPrice != null) httpParams = httpParams.set('minPrice', String(params.minPrice));
    if (params.maxPrice != null) httpParams = httpParams.set('maxPrice', String(params.maxPrice));
    if (params.inStock != null) httpParams = httpParams.set('inStock', String(params.inStock));

    return this.http.get<{ data: Product[]; meta: ProductListMeta }>(
      `${this.productsApiUrl}/manage`,
      {
        params: httpParams,
      },
    );
  }

  createProduct(product: ProductUpsertPayload) {
    return this.http.post<{ data: Product }>(this.productsApiUrl, product);
  }

  updateProduct(productId: string, payload: Partial<ProductUpsertPayload>) {
    return this.http.put<{ data: Product }>(`${this.productsApiUrl}/${productId}`, payload);
  }

  deleteProduct(productId: string) {
    return this.http.delete<{ message: string }>(`${this.productsApiUrl}/${productId}`);
  }

  getReviewsByProduct(productId: string) {
    return this.http.get<{ data: Review[] }>(`${this.productsApiUrl}/${productId}/reviews`);
  }

  createReview(productId: string, review: { rating: number; comment?: string }) {
    return this.http.post<{ data: Review }>(`${this.productsApiUrl}/${productId}/reviews`, review);
  }
}
