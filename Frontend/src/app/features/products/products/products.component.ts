import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Injector,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { combineLatest, debounceTime, switchMap } from 'rxjs';
import {
  Product,
  ProductCategory,
  ProductListMeta,
  ProductListParams,
  ProductsService,
} from './products.service';
import { WishlistService } from '../wishlist/wishlist.service';

type SortOption = 'featured' | 'priceAsc' | 'priceDesc' | 'rating';

const SORT_API_MAP: Record<SortOption, ProductListParams['sort']> = {
  featured: 'newest',
  priceAsc: 'price_asc',
  priceDesc: 'price_desc',
  rating: 'newest',
};

@Component({
  selector: 'app-products',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsComponent implements OnInit {
  private readonly productsService = inject(ProductsService);
  private readonly wishlistService = inject(WishlistService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  protected readonly products = signal<Product[]>([]);
  protected readonly allCategories = signal<ProductCategory[]>([]);
  protected readonly meta = signal<ProductListMeta | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly selectedCategory = signal('');
  protected readonly sortBy = signal<SortOption>('featured');
  protected readonly viewMode = signal<'grid' | 'compact'>('grid');
  protected readonly searchQuery = signal('');
  protected readonly minPrice = signal<number | null>(null);
  protected readonly maxPrice = signal<number | null>(null);
  protected readonly minRating = signal<number | null>(null);

  protected readonly categoryCounts = computed(() =>
    this.allCategories()
      .map((cat) => ({ name: cat.slug, displayName: cat.name, count: cat.productCount }))
      .sort((a, b) => b.count - a.count),
  );

  protected readonly productRangeLabel = computed(() => {
    const m = this.meta();
    const shown = this.products().length;
    if (!m || m.total === 0) return '0 results';
    return `${shown} of ${m.total} result${m.total !== 1 ? 's' : ''}`;
  });

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const q = params.get('q')?.trim() || '';
      const category = params.get('category')?.trim().toLowerCase() || '';
      this.searchQuery.set(q);
      this.selectedCategory.set(category);
    });

    this.productsService.getCategories().subscribe({
      next: (res) => this.allCategories.set(res.data),
      error: () => {
        this.allCategories.set([]);
      },
    });

    combineLatest([
      toObservable(this.selectedCategory, { injector: this.injector }),
      toObservable(this.searchQuery, { injector: this.injector }),
      toObservable(this.sortBy, { injector: this.injector }),
      toObservable(this.minPrice, { injector: this.injector }),
      toObservable(this.maxPrice, { injector: this.injector }),
      toObservable(this.minRating, { injector: this.injector }),
    ])
      .pipe(
        debounceTime(50),
        switchMap(([category, query, sort, minPrice, maxPrice, minRating]) => {
          this.isLoading.set(true);
          const params: ProductListParams = {
            sort: SORT_API_MAP[sort],
            limit: 48,
          };

          let safeMin = minPrice;
          let safeMax = maxPrice;
          if (safeMin != null && safeMax != null && safeMin > safeMax) {
            [safeMin, safeMax] = [safeMax, safeMin];
          }

          if (category) params.category = category;
          if (query) params.q = query;
          if (safeMin != null) params.minPrice = safeMin;
          if (safeMax != null) params.maxPrice = safeMax;
          if (minRating != null) params.minRating = minRating;

          return this.productsService.getProducts(params);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.products.set(response.data);
          this.meta.set(response.meta);
          this.isLoading.set(false);
        },
        error: () => {
          this.products.set([]);
          this.meta.set(null);
          this.isLoading.set(false);
        },
      });
  }

  protected setSortBy(value: string): void {
    if (
      value === 'priceAsc' ||
      value === 'priceDesc' ||
      value === 'rating' ||
      value === 'featured'
    ) {
      this.sortBy.set(value as SortOption);
    }
  }

  protected setViewMode(mode: 'grid' | 'compact'): void {
    this.viewMode.set(mode);
  }

  protected setSelectedCategory(category: string): void {
    this.selectedCategory.set(category.toLowerCase());
  }

  protected clearCategory(): void {
    this.selectedCategory.set('');
    this.minPrice.set(null);
    this.maxPrice.set(null);
    this.minRating.set(null);
  }

  protected setMinRating(rating: number, checked: boolean): void {
    if (checked) {
      this.minRating.set(rating);
      return;
    }
    if (this.minRating() === rating) {
      this.minRating.set(null);
    }
  }

  protected setMinPrice(value: string): void {
    this.minPrice.set(this.parsePriceInput(value));
  }

  protected setMaxPrice(value: string): void {
    this.maxPrice.set(this.parsePriceInput(value));
  }

  private parsePriceInput(value: string): number | null {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    if (Number.isNaN(parsed) || parsed < 0) return null;
    return parsed;
  }

  protected displayCategoryName(value: string): string {
    return value
      .split(/[-_\s]/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  protected providerName(product: Product): string {
    const owner = product.owner;

    if (!owner) {
      return 'Platform Catalog';
    }

    if (typeof owner === 'string') {
      return 'Seller';
    }

    const fullName = `${owner.firstName ?? ''} ${owner.lastName ?? ''}`.trim();
    if (fullName) {
      return fullName;
    }

    return owner.email ?? 'Seller';
  }

  protected productImage(product: Product): string {
    const imageUrl = product.imageUrl?.trim();
    return imageUrl || '/product-placeholder.svg';
  }

  protected isSavedForLater(productId: string): boolean {
    return this.wishlistService.isInWishlist(productId);
  }

  protected toggleSaveForLater(product: Product): void {
    this.wishlistService.toggle(product);
  }
}
