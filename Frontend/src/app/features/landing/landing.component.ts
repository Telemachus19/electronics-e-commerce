import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

type Category = { name: string; total: string };
type Product = {
  badge?: string;
  title: string;
  price: string;
  rating: number;
  reviews: number;
};

@Component({
  selector: 'app-landing',
  imports: [RouterLink],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent {
  protected readonly categories = signal<Category[]>([
    { name: 'Audio', total: '245 Products' },
    { name: 'Laptops', total: '189 Products' },
    { name: 'Smartphones', total: '312 Products' },
    { name: 'Cameras', total: '156 Products' },
  ]);

  protected readonly trending = signal<Product[]>([
    {
      badge: '-30%',
      title: 'Premium Wireless Earbuds Pro',
      price: '$159',
      rating: 5,
      reviews: 128,
    },
    {
      badge: 'New',
      title: 'Ultra Smart Watch Series 8',
      price: '$399',
      rating: 4,
      reviews: 92,
    },
    {
      title: 'Professional DSLR Camera Kit',
      price: '$1,299',
      rating: 5,
      reviews: 245,
    },
    {
      badge: 'Best Seller',
      title: 'Gaming Laptop Pro 15"',
      price: '$1,899',
      rating: 5,
      reviews: 174,
    },
  ]);
}
