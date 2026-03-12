import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductsService } from './products.service';

interface Category {
  id: string;
  name: string;
  description: string;
  productCount: number;
  image: string;
  color: string;
}

@Component({
  selector: 'app-categories',
  imports: [CommonModule, RouterLink],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesComponent implements OnInit {
  private readonly productsService = inject(ProductsService);

  protected readonly isLoading = signal(true);
  protected readonly searchQuery = signal('');
  protected readonly sortBy = signal('popularity');
  protected readonly viewMode = signal<'grid' | 'list'>('grid');
  protected readonly allCategories = signal<Category[]>([]);

  protected readonly featuredCollections = [
    {
      title: 'Trending Now',
      subtitle: 'Most popular items this week',
      tag: '',
      background:
        'radial-gradient(circle at 25% 20%, rgba(67, 108, 255, 0.35), transparent 45%), radial-gradient(circle at 80% 80%, rgba(6, 182, 212, 0.25), transparent 38%), linear-gradient(135deg, #0f172a 0%, #020617 100%)',
    },
    {
      title: 'New Arrivals',
      subtitle: 'Latest products just added',
      tag: '',
      background:
        'radial-gradient(circle at 10% 15%, rgba(14, 165, 233, 0.28), transparent 35%), radial-gradient(circle at 90% 75%, rgba(99, 102, 241, 0.24), transparent 42%), linear-gradient(135deg, #111827 0%, #020617 100%)',
    },
    {
      title: 'On Sale',
      subtitle: 'Up to 70% off selected items',
      tag: 'Sale',
      background:
        'radial-gradient(circle at 80% 15%, rgba(251, 113, 133, 0.26), transparent 35%), radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.22), transparent 40%), linear-gradient(135deg, #131a2a 0%, #020617 100%)',
    },
  ] as const;

  protected readonly footerColumns = [
    {
      title: 'Categories',
      items: ['Electronics', 'Fashion', 'Home & Garden', 'Sports'],
    },
    {
      title: 'Customer Service',
      items: ['Help Center', 'Returns', 'Shipping Info', 'Contact Us'],
    },
    {
      title: 'Company',
      items: ['About Us', 'Careers', 'Privacy Policy', 'Terms of Service'],
    },
  ] as const;

  private readonly gradientMap: Record<string, string> = {
    smartphones: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    laptops: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
    computers: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
    audio: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
    headphones: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
    wearables: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    cameras: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    gaming: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    tablets: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
    accessories: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    electronics: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
  };

  private readonly categoryMetadata: Record<string, { image: string; description: string }> = {
    smartphones: {
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
      description: 'Latest phones and accessories',
    },
    laptops: {
      image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
      description: 'Desktops, laptops, and accessories',
    },
    computers: {
      image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
      description: 'Desktops, laptops, and accessories',
    },
    audio: {
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
      description: 'Headphones, speakers, earbuds',
    },
    headphones: {
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
      description: 'Headphones, speakers, earbuds',
    },
    wearables: {
      image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400',
      description: 'Smartwatches and fitness trackers',
    },
    cameras: {
      image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400',
      description: 'DSLR, mirrorless, accessories',
    },
    gaming: {
      image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400',
      description: 'Consoles, controllers, accessories',
    },
    tablets: {
      image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400',
      description: 'iPads, Android tablets, Kindles',
    },
    accessories: {
      image: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=400',
      description: 'Cases, chargers, cables',
    },
    electronics: {
      image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400',
      description: 'General electronics and gadgets',
    },
  };

  ngOnInit(): void {
    this.loadCategories();
  }

  protected readonly filteredCategories = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const categories = this.allCategories();

    if (!query) return categories;

    return categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(query) || cat.description.toLowerCase().includes(query),
    );
  });

  protected readonly sortedCategories = computed(() => {
    const categories = [...this.filteredCategories()];
    const currentSort = this.sortBy();

    switch (currentSort) {
      case 'popularity':
      case 'products':
        return categories.sort((a, b) => b.productCount - a.productCount);
      case 'name':
        return categories.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return categories;
    }
  });

  protected setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode.set(mode);
  }

  protected setSortBy(value: string): void {
    this.sortBy.set(value);
  }

  protected categoryInitial(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  protected onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  private getGradientStyle(categoryId: string): string {
    return this.gradientMap[categoryId] || this.gradientMap['electronics'];
  }

  private loadCategories(): void {
    this.isLoading.set(true);
    this.productsService.getCategories().subscribe({
      next: (response) => {
        const categories: Category[] = response.data.map((category) => {
          const slug = category.slug ?? category.name.toLowerCase();
          const metadata = this.categoryMetadata[slug] ?? this.categoryMetadata['electronics'];

          return {
            id: slug,
            name: category.name,
            description: category.description || metadata.description,
            productCount: category.productCount,
            image: category.imageUrl || metadata.image,
            color: this.getGradientStyle(slug),
          };
        });

        this.allCategories.set(categories);
        this.isLoading.set(false);
      },
      error: () => {
        this.allCategories.set([]);
        this.isLoading.set(false);
      },
    });
   }
 }
