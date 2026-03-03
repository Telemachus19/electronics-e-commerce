import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UserManagementComponent } from '../../features/users/user-management.component';

@Component({
  selector: 'app-root',
  imports: [UserManagementComponent],
  template: '<app-user-management></app-user-management>',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {}
