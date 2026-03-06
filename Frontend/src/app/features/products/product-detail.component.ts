import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgClass, DatePipe } from '@angular/common';
import { ProductsService, Product, Review } from './products.service';

@Component({
  selector: 'app-product-detail',
  imports: [NgClass, RouterLink, DatePipe],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailComponent implements OnInit {
  private readonly productsService = inject(ProductsService);
  private readonly route = inject(ActivatedRoute);

  protected readonly product = signal<Product | null>(null);
  protected readonly reviews = signal<Review[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (!productId) {
      this.error.set('Product not found');
      this.isLoading.set(false);
      return;
    }

    this.productsService.getProductById(productId).subscribe({
      next: (response) => {
        this.product.set(response.data);
        this.reviews.set(response.data.reviews || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Failed to load product');
        this.isLoading.set(false);
      },
    });
  }
}
