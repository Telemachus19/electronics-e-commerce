import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProductsService, Product, Review } from '../products/products.service';
import { CartService } from '../cart/cart.service';
import { WishlistService } from '../wishlist/wishlist.service';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, DatePipe, DecimalPipe, FormsModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailComponent implements OnInit {
  private readonly productsService = inject(ProductsService);
  private readonly cartService = inject(CartService);
  private readonly wishlistService = inject(WishlistService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly tabs = ['description', 'specifications', 'reviews', 'shipping'] as const;
  protected readonly ratingScale = [5, 4, 3, 2, 1] as const;

  protected readonly product = signal<Product | null>(null);
  protected readonly reviews = signal<Review[]>([]);
  protected readonly activeImageIndex = signal(0);
  protected readonly activeTab = signal<(typeof this.tabs)[number]>('description');
  protected readonly quantity = signal(1);
  protected readonly isAddingToCart = signal(false);
  protected readonly cartFeedback = signal<string | null>(null);
  protected readonly cartFeedbackType = signal<'success' | 'error' | 'info'>('info');
  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);

  // Review form state
  protected readonly newRating = signal(0);
  protected readonly hoverRating = signal(0);
  protected readonly newComment = signal('');
  protected readonly isSubmittingReview = signal(false);
  protected readonly reviewFeedback = signal<string | null>(null);
  protected readonly reviewFeedbackType = signal<'success' | 'error'>('error');
  protected readonly starScale = [1, 2, 3, 4, 5] as const;

  protected readonly galleryImages = computed(() => {
    const current = this.product();
    if (!current) return [];

    const galleryFromImages = (current.images || [])
      .filter((image) => Boolean(image?.url))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((image) => ({
        url: image.url,
        alt: image.altText || current.name,
      }));

    if (galleryFromImages.length > 0) {
      return galleryFromImages;
    }

    return current.imageUrl
      ? [
          {
            url: current.imageUrl,
            alt: current.name,
          },
        ]
      : [];
  });

  protected readonly currentImage = computed(() => {
    const images = this.galleryImages();
    if (images.length === 0) return null;
    return images[Math.min(this.activeImageIndex(), images.length - 1)] || images[0];
  });

  protected readonly averageRating = computed(() => {
    const current = this.product();
    if (!current) return 0;
    if (typeof current.ratingAverage === 'number' && current.ratingAverage > 0) {
      return Number(current.ratingAverage.toFixed(1));
    }
    const reviewList = this.reviews();
    if (reviewList.length === 0) return 0;
    const average = reviewList.reduce((sum, review) => sum + review.rating, 0) / reviewList.length;
    return Number(average.toFixed(1));
  });

  protected readonly ratingCount = computed(() => {
    const current = this.product();
    if (!current) return 0;
    if (typeof current.ratingCount === 'number' && current.ratingCount > 0) {
      return current.ratingCount;
    }
    return this.reviews().length;
  });

  protected readonly discountPercent = computed(() => {
    const current = this.product();
    if (!current?.compareAtPrice || current.compareAtPrice <= current.price) return 0;
    return Math.round(((current.compareAtPrice - current.price) / current.compareAtPrice) * 100);
  });

  protected readonly attributeRows = computed(() => {
    const current = this.product();
    if (!current?.attributes) return [];

    return Object.entries(current.attributes).map(([key, value]) => ({
      key,
      label: this.formatAttributeKey(key),
      value,
    }));
  });

  protected readonly ratingBars = computed(() => {
    const reviewList = this.reviews();
    const total = reviewList.length;
    return this.ratingScale.map((rating) => {
      const count = reviewList.filter((review) => review.rating === rating).length;
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
      return { rating, percentage, count };
    });
  });

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const productId = params.get('id');
      if (!productId) {
        this.error.set('Product not found');
        this.isLoading.set(false);
        return;
      }

      this.loadProduct(productId);
    });
  }

  protected setActiveImage(index: number): void {
    this.activeImageIndex.set(index);
  }

  protected setActiveTab(tab: (typeof this.tabs)[number]): void {
    this.activeTab.set(tab);
  }

  protected incrementQuantity(): void {
    const stock = this.product()?.stock ?? 1;
    this.quantity.set(Math.min(stock, this.quantity() + 1));
  }

  protected decrementQuantity(): void {
    this.quantity.set(Math.max(1, this.quantity() - 1));
  }

  protected addCurrentProductToCart(): void {
    const currentProduct = this.product();
    if (!currentProduct) return;

    this.isAddingToCart.set(true);
    this.cartFeedback.set(null);

    this.cartService
      .addToCart(currentProduct._id, this.quantity(), {
        name: currentProduct.name,
        price: currentProduct.price,
        imageUrl: currentProduct.imageUrl,
      })
      .subscribe({
        next: () => {
          this.cartFeedbackType.set('success');
          this.cartFeedback.set('Added to cart successfully.');
          this.isAddingToCart.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.cartFeedbackType.set('error');
          const message =
            (error.error as { message?: string } | null)?.message ||
            'Unable to add to cart right now.';
          this.cartFeedback.set(message);
          this.isAddingToCart.set(false);
        },
      });
  }

  protected saveCurrentProductForLater(): void {
    const currentProduct = this.product();
    if (!currentProduct) {
      return;
    }

    const added = this.wishlistService.toggle(currentProduct);
    this.cartFeedbackType.set('info');
    this.cartFeedback.set(added ? 'Saved to wishlist.' : 'Removed from wishlist.');
  }

  protected isSavedForLater(): boolean {
    const currentProduct = this.product();
    if (!currentProduct) {
      return false;
    }
    return this.wishlistService.isInWishlist(currentProduct._id);
  }

  protected categoryLabel(): string {
    const category = this.product()?.category || this.product()?.categoryId?.name || 'Products';
    return category
      .split(/[-_\s]/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  protected reviewInitials(review: Review): string {
    const first = review.user.firstName?.charAt(0) || '';
    const last = review.user.lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase() || 'U';
  }

  protected setNewRating(rating: number): void {
    this.newRating.set(rating);
  }

  protected setHoverRating(rating: number): void {
    this.hoverRating.set(rating);
  }

  protected submitReview(): void {
    const currentProduct = this.product();
    if (!currentProduct) return;

    if (!this.authService.isAuthenticated()) {
      this.reviewFeedbackType.set('error');
      this.reviewFeedback.set('Please sign in to leave a review.');
      return;
    }

    if (this.newRating() === 0) {
      this.reviewFeedbackType.set('error');
      this.reviewFeedback.set('Please select a rating.');
      return;
    }

    this.isSubmittingReview.set(true);
    this.reviewFeedback.set(null);

    const payload: { rating: number; comment?: string } = { rating: this.newRating() };
    const comment = this.newComment().trim();
    if (comment) payload.comment = comment;

    this.productsService.createReview(currentProduct._id, payload).subscribe({
      next: (response) => {
        this.reviews.update((prev) => [response.data, ...prev]);
        this.newRating.set(0);
        this.hoverRating.set(0);
        this.newComment.set('');
        this.reviewFeedbackType.set('success');
        this.reviewFeedback.set('Review submitted successfully!');
        this.isSubmittingReview.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.reviewFeedbackType.set('error');
        const message =
          (err.error as { message?: string } | null)?.message || 'Failed to submit review.';
        this.reviewFeedback.set(message);
        this.isSubmittingReview.set(false);
      },
    });
  }

  protected providerName(): string {
    const owner = this.product()?.owner;

    if (!owner) {
      return 'TechMart';
    }

    if (typeof owner === 'string') {
      return 'Verified Seller';
    }

    const fullName = `${owner.firstName ?? ''} ${owner.lastName ?? ''}`.trim();
    if (fullName) {
      return fullName;
    }

    return owner.email ?? 'Verified Seller';
  }

  private loadReviews(productId: string): void {
    this.productsService.getReviewsByProduct(productId).subscribe({
      next: (response) => this.reviews.set(response.data),
      error: () => {},
    });
  }

  private loadProduct(productId: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.productsService.getProductById(productId).subscribe({
      next: (response) => {
        this.product.set(response.data);
        this.reviews.set(response.data.reviews || []);
        this.loadReviews(productId);
        this.activeImageIndex.set(0);
        this.activeTab.set('description');
        this.quantity.set(1);
        this.cartFeedback.set(null);
        this.isAddingToCart.set(false);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Failed to load product');
        this.product.set(null);
        this.reviews.set([]);
        this.isLoading.set(false);
      },
    });
  }

  private formatAttributeKey(value: string): string {
    return value
      .split(/[-_\s]/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
