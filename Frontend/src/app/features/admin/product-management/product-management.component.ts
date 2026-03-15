import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { Product, ProductsService } from '../../products/products/products.service';
import { DecimalPipe } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-product-management',
  imports: [DecimalPipe],
  templateUrl: './product-management.component.html',
  styleUrl: './product-management.component.css',
  host: {
    '[class.embedded]': 'embedded()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductManagementComponent implements OnInit {
  private readonly fallbackProductImage = '/product-placeholder.svg';

  private readonly productsService = inject(ProductsService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly embedded = input(false);

  protected readonly products = signal<Product[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly deletingProductId = signal<string | null>(null);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly searchTerm = signal('');
  protected readonly sortBy = signal<
    'newest' | 'price_asc' | 'price_desc' | 'name_asc' | 'stock_desc'
  >('newest');
  protected readonly viewMode = signal<'details' | 'grid'>('details');
  protected readonly isSeller = computed(() => this.authService.role() === 'seller');
  protected readonly subtitle = computed(() =>
    this.isSeller()
      ? 'View and manage only products that you own.'
      : 'Browse, search, sort, and maintain the full catalog.',
  );

  protected readonly filteredProducts = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    const sort = this.sortBy();

    let result = this.products();

    if (query) {
      result = result.filter((product) => {
        const haystack = [
          product.name,
          product.category,
          product.brand,
          product.sku,
          product.slug,
          product.description,
        ]
          .filter((value): value is string => typeof value === 'string')
          .join(' ')
          .toLowerCase();

        return haystack.includes(query);
      });
    }

    const sorted = [...result];

    if (sort === 'price_asc') {
      sorted.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    } else if (sort === 'price_desc') {
      sorted.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    } else if (sort === 'name_asc') {
      sorted.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
    } else if (sort === 'stock_desc') {
      sorted.sort((a, b) => (b.stock ?? 0) - (a.stock ?? 0));
    }

    return sorted;
  });

  ngOnInit(): void {
    this.loadProducts();
  }

  protected setSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  protected setSortBy(value: string): void {
    if (
      value === 'newest' ||
      value === 'price_asc' ||
      value === 'price_desc' ||
      value === 'name_asc' ||
      value === 'stock_desc'
    ) {
      this.sortBy.set(value);
    }
  }

  protected setViewMode(mode: 'details' | 'grid'): void {
    this.viewMode.set(mode);
  }

  protected goToAddProduct(): void {
    void this.router.navigate(['/admin/products/new'], {
      queryParams: { returnTo: this.router.url },
    });
  }

  protected goToEditProduct(productId: string): void {
    void this.router.navigate(['/admin/products', productId, 'edit'], {
      queryParams: { returnTo: this.router.url },
    });
  }

  protected deleteProduct(productId: string, productName: string): void {
    if (!window.confirm(`Delete ${productName}? This action cannot be undone.`)) {
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');
    this.deletingProductId.set(productId);

    this.productsService.deleteProduct(productId).subscribe({
      next: () => {
        this.products.update((current) => current.filter((product) => product._id !== productId));
        this.deletingProductId.set(null);
        this.successMessage.set('Product deleted successfully.');
      },
      error: (error: { error?: { message?: string } }) => {
        this.deletingProductId.set(null);
        this.errorMessage.set(error.error?.message ?? 'Failed to delete product.');
      },
    });
  }

  protected isDeleting(productId: string): boolean {
    return this.deletingProductId() === productId;
  }

  protected productImage(product: Product): string {
    const imageUrl = product.imageUrl?.trim();
    return imageUrl || this.fallbackProductImage;
  }

  protected onProductImageError(event: Event): void {
    const image = event.target as HTMLImageElement | null;
    if (!image || image.src.endsWith(this.fallbackProductImage)) {
      return;
    }

    image.src = this.fallbackProductImage;
  }

  protected formatCategory(category: string | null | undefined): string {
    const value = (category ?? '').trim();
    if (!value) {
      return 'Uncategorized';
    }

    return value.charAt(0).toUpperCase() + value.slice(1);
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

  private loadProducts(): void {
    this.isLoading.set(true);
    this.productsService.getManagedProducts({ limit: 100, sort: 'newest' }).subscribe({
      next: (response) => {
        this.products.set(response.data);
        this.isLoading.set(false);
      },
      error: () => {
        this.products.set([]);
        this.errorMessage.set('Failed to load products.');
        this.isLoading.set(false);
      },
    });
  }
}
