import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
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

  protected readonly categories = signal<CategoryCard[]>([]);
  protected readonly trending = signal<Product[]>([]);

  ngOnInit(): void {
    this.loadCategories();
    this.loadTrendingProducts();
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
