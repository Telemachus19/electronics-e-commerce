import { Routes } from '@angular/router';
import { UserManagementComponent } from '../../features/users/user-management/user-management.component';
import { ProfileComponent } from '../../features/users/profile/profile.component';
import { ProductManagementComponent } from '../../features/admin/product-management/product-management.component';
import { ProductEditorComponent } from '../../features/admin/product-editor/product-editor.component';
import { PanelComponent } from '../../features/admin/panel/panel.component';
import { ProductsComponent } from '../../features/products/products/products.component';
import { CategoriesComponent } from '../../features/products/categories/categories.component';
import { ProductDetailComponent } from '../../features/products/product-detail/product-detail.component';
import { WishlistComponent } from '../../features/products/wishlist/wishlist.component';
import { CartComponent } from '../../features/products/cart/cart.component';
import { CheckoutComponent } from '../../features/products/checkout.component';
import { LoginComponent } from '../../features/auth/login/login.component';
import { RegisterComponent } from '../../features/auth/register/register.component';
import { VerifyUserComponent } from '../../features/auth/verification/verify-email/verify-user.component';
import { VerifyOtpComponent } from '../../features/auth/verification/verify-otp/verify-otp.component';
import { adminGuard, authGuard, sellerOrAdminGuard } from '../auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../../features/landing/landing.component').then((m) => m.LandingComponent),
  },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'verify-user', component: VerifyUserComponent },
  { path: 'verify-user/otp', component: VerifyOtpComponent },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'panel', component: PanelComponent, canActivate: [authGuard, sellerOrAdminGuard] },
  {
    path: 'admin/products',
    component: ProductManagementComponent,
    canActivate: [authGuard, sellerOrAdminGuard],
  },
  {
    path: 'admin/products/new',
    component: ProductEditorComponent,
    canActivate: [authGuard, sellerOrAdminGuard],
  },
  {
    path: 'admin/products/:id/edit',
    component: ProductEditorComponent,
    canActivate: [authGuard, sellerOrAdminGuard],
  },
  { path: 'users', component: UserManagementComponent, canActivate: [authGuard, adminGuard] },
  { path: 'categories', component: CategoriesComponent },
  { path: 'products', component: ProductsComponent },
  { path: 'products/:id', component: ProductDetailComponent },
  { path: 'wishlist', component: WishlistComponent },
  { path: 'cart', component: CartComponent },
  { path: 'checkout', component: CheckoutComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
