import { Routes } from '@angular/router';
import { UserManagementComponent } from '../../features/users/user-management.component';
import { ProductsComponent } from '../../features/products/products.component';
import { ProductDetailComponent } from '../../features/products/product-detail.component';

export const routes: Routes = [
  { path: '', redirectTo: 'users', pathMatch: 'full' },
  { path: 'users', component: UserManagementComponent },
  { path: 'products', component: ProductsComponent },
  { path: 'products/:id', component: ProductDetailComponent },
];
