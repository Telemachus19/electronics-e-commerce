import { Routes } from '@angular/router';
import { UserManagementComponent } from '../../features/users/user-management.component';
import { ProductsComponent } from '../../features/products/products.component';
import { CategoriesComponent } from '../../features/products/categories.component';
import { ProductDetailComponent } from '../../features/products/product-detail.component';
import { CartComponent } from '../../features/products/cart.component';
import { CheckoutComponent } from '../../features/products/checkout.component';
import { LoginComponent } from '../../features/auth/login.component';
import { RegisterComponent } from '../../features/auth/register.component';
import { adminGuard, authGuard } from '../auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../../features/landing/landing.component').then((m) => m.LandingComponent),
  },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'users', component: UserManagementComponent, canActivate: [authGuard, adminGuard] },
  { path: 'categories', component: CategoriesComponent },
  { path: 'products', component: ProductsComponent },
  { path: 'products/:id', component: ProductDetailComponent },
  { path: 'cart', component: CartComponent },
  { path: 'checkout', component: CheckoutComponent },
  { path: '**', redirectTo: '' },
];
