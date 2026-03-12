import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductsService, Product, ProductCategory } from '../products/products.service';

type CategoryCard = {
  name: string;
  slug: string;
  total: string;
};

@Component({
  selector: 'app-landing',
  imports: [RouterLink],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent implements OnInit {
  private readonly productsService = inject(ProductsService);
  private readonly destroyRef = inject(DestroyRef);
  private touchStartX: number | null = null;

  protected readonly heroProducts = signal<Product[]>([]);
  protected readonly activeHeroIndex = signal(0);
  protected readonly categories = signal<CategoryCard[]>([]);
  protected readonly trending = signal<Product[]>([]);
  protected readonly activeHeroProduct = computed(() => {
    const items = this.heroProducts();
    if (items.length === 0) return null;
    return items[this.activeHeroIndex()] || items[0] || null;
  });

  ngOnInit(): void {
    this.loadHeroProducts();
    this.loadCategories();
    this.loadTrendingProducts();
  }

  protected setHeroSlide(index: number): void {
    const items = this.heroProducts();
    if (items.length === 0) return;
    const safeIndex = Math.max(0, Math.min(index, items.length - 1));
    this.activeHeroIndex.set(safeIndex);
  }

  protected nextHeroSlide(): void {
    const items = this.heroProducts();
    if (items.length < 2) return;
    this.activeHeroIndex.set((this.activeHeroIndex() + 1) % items.length);
  }

  protected previousHeroSlide(): void {
    const items = this.heroProducts();
    if (items.length < 2) return;
    this.activeHeroIndex.set((this.activeHeroIndex() - 1 + items.length) % items.length);
  }

  protected onHeroTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0]?.clientX ?? null;
  }

  protected onHeroTouchEnd(event: TouchEvent): void {
    const endX = event.changedTouches[0]?.clientX;
    if (this.touchStartX == null || endX == null) return;

    const deltaX = endX - this.touchStartX;
    const swipeThreshold = 40;

    if (Math.abs(deltaX) >= swipeThreshold) {
      if (deltaX < 0) {
        this.nextHeroSlide();
      } else {
        this.previousHeroSlide();
      }
    }

    this.touchStartX = null;
  }

  protected heroDescription(product: Product): string {
    if (!product.description) {
      return 'Discover premium quality and unbeatable value on this featured product.';
    }

    const trimmed = product.description.trim();
    if (trimmed.length <= 120) {
      return trimmed;
    }

    return `${trimmed.slice(0, 117)}...`;
  }

  protected heroTag(product: Product): string {
    if (product.compareAtPrice && product.compareAtPrice > product.price) {
      return 'Limited Deal';
    }
    return 'New Release';
  }

  protected categoryIconKey(slug: string): string {
    if (slug.includes('audio') || slug.includes('headphone')) return 'audio';
    if (slug.includes('laptop') || slug.includes('computer')) return 'laptops';
    if (slug.includes('smartphone') || slug.includes('phone')) return 'smartphones';
    return 'default';
  }

  protected productBadge(product: Product): string | null {
    if (product.compareAtPrice && product.compareAtPrice > product.price) {
      const discount = Math.round(
        ((product.compareAtPrice - product.price) / product.compareAtPrice) * 100,
      );
      return `-${discount}%`;
    }
    if ((product.ratingAverage ?? 0) >= 4.7) return 'Best Seller';
    return null;
  }

  protected productRatingStars(product: Product): string {
    const stars = Math.max(1, Math.min(5, Math.round(product.ratingAverage ?? 0)));
    return '★'.repeat(stars);
  }

  protected productRouteId(product: Product): string {
    return product.slug || product._id;
  }

  protected productImage(product: Product): string {
    const primaryGalleryImage = product.images?.find((image) => image.isPrimary)?.url;
    const firstGalleryImage = product.images?.[0]?.url;

    return (
      primaryGalleryImage ||
      firstGalleryImage ||
      product.imageUrl ||
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=640&auto=format&fit=crop'
    );
  }

  private loadCategories(): void {
    this.productsService.getCategories().subscribe({
      next: (response) => {
        const cards: CategoryCard[] = [...response.data]
          .sort((a, b) => b.productCount - a.productCount)
          .slice(0, 4)
          .map((category: ProductCategory) => ({
            name: category.name,
            slug: category.slug,
            total: `${category.productCount} Products`,
          }));

        this.categories.set(cards);
      },
      error: () => {
        this.categories.set([]);
      },
    });
  }

  private loadHeroProducts(): void {
    this.productsService.getProducts({ limit: 5, sort: 'newest' }).subscribe({
      next: (response) => {
        this.heroProducts.set(response.data);
        this.activeHeroIndex.set(0);
        this.startHeroAutoplay();
      },
      error: () => {
        this.heroProducts.set([]);
      },
    });
  }

  private startHeroAutoplay(): void {
    const items = this.heroProducts();
    if (items.length < 2) return;

    const timer = setInterval(() => {
      this.nextHeroSlide();
    }, 5000);

    this.destroyRef.onDestroy(() => {
      clearInterval(timer);
    });
  }

  private loadTrendingProducts(): void {
    this.productsService.getProducts({ limit: 4, sort: 'newest' }).subscribe({
      next: (response) => {
        this.trending.set(response.data);
      },
      error: () => {
        this.trending.set([]);
      },
    });
  }
}
