import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductUpsertPayload, ProductsService } from '../../products/products/products.service';

@Component({
  selector: 'app-product-editor',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './product-editor.component.html',
  styleUrl: './product-editor.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductEditorComponent implements OnInit {
  private readonly productsService = inject(ProductsService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly isSaving = signal(false);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly editingProductId = signal<string | null>(null);
  protected readonly returnTo = signal('/panel');

  protected readonly title = computed(() =>
    this.editingProductId() ? 'Edit Product' : 'Add Product',
  );

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    price: [0, [Validators.required, Validators.min(0)]],
    compareAtPrice: [''],
    stock: [0, [Validators.required, Validators.min(0)]],
    category: [''],
    brand: [''],
    slug: [''],
    sku: [''],
    imageUrl: [''],
  });

  ngOnInit(): void {
    const returnTo = this.route.snapshot.queryParamMap.get('returnTo');
    this.returnTo.set(returnTo || '/panel');

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }

    this.editingProductId.set(id);
    this.isLoading.set(true);

    this.productsService.getProductById(id).subscribe({
      next: (response) => {
        const product = response.data;
        this.form.patchValue({
          name: product.name ?? '',
          description: product.description ?? '',
          price: product.price ?? 0,
          compareAtPrice:
            typeof product.compareAtPrice === 'number' ? String(product.compareAtPrice) : '',
          stock: product.stock ?? 0,
          category: product.category ?? '',
          brand: product.brand ?? '',
          slug: product.slug ?? '',
          sku: product.sku ?? '',
          imageUrl: product.imageUrl ?? '',
        });
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load product details.');
        this.isLoading.set(false);
      },
    });
  }

  protected onSubmit(): void {
    if (this.form.invalid || this.isSaving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');
    this.isSaving.set(true);

    const payload = this.buildPayload();
    const productId = this.editingProductId();

    const request$ = productId
      ? this.productsService.updateProduct(productId, payload)
      : this.productsService.createProduct(payload);

    request$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.successMessage.set(
          productId ? 'Product updated successfully.' : 'Product created successfully.',
        );
        setTimeout(() => {
          void this.router.navigateByUrl(this.returnTo());
        }, 400);
      },
      error: (error: { error?: { message?: string } }) => {
        this.isSaving.set(false);
        this.errorMessage.set(error.error?.message ?? 'Failed to save product.');
      },
    });
  }

  protected cancel(): void {
    void this.router.navigateByUrl(this.returnTo());
  }

  private buildPayload(): ProductUpsertPayload {
    const raw = this.form.getRawValue();

    const compareAtPrice = raw.compareAtPrice.trim() ? Number(raw.compareAtPrice) : null;

    return {
      name: raw.name.trim(),
      description: raw.description.trim() || undefined,
      price: Number(raw.price),
      compareAtPrice,
      stock: Number(raw.stock),
      category: raw.category.trim().toLowerCase() || undefined,
      brand: raw.brand.trim() || undefined,
      slug: raw.slug.trim().toLowerCase() || undefined,
      sku: raw.sku.trim().toUpperCase() || undefined,
      imageUrl: raw.imageUrl.trim() || undefined,
    };
  }
}
