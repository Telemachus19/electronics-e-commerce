import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { ProductManagementComponent } from '../product-management/product-management.component';
import { UserManagementComponent } from '../../users/user-management/user-management.component';

type PanelTab = 'products' | 'users';

@Component({
  selector: 'app-panel',
  imports: [ProductManagementComponent, UserManagementComponent],
  templateUrl: './panel.component.html',
  styleUrl: './panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PanelComponent {
  private readonly authService = inject(AuthService);

  protected readonly role = computed(() => this.authService.role() ?? 'guest');
  protected readonly isAdmin = computed(() => this.role() === 'admin');
  protected readonly panelName = computed(() => (this.isAdmin() ? 'Admin Panel' : 'Seller Panel'));
  protected readonly activeTab = signal<PanelTab>('products');
  protected readonly sectionTitle = computed(() =>
    this.activeTab() === 'products' ? 'Product Management' : 'User Management',
  );
  protected readonly sectionSubtitle = computed(() => {
    if (this.activeTab() === 'products') {
      return this.isAdmin()
        ? 'Manage the product catalog from this workspace.'
        : 'Manage your product catalog from this workspace.';
    }

    return 'Manage roles, restrictions, and user accounts from this workspace.';
  });

  protected setTab(tab: PanelTab): void {
    this.activeTab.set(tab);
  }
}
