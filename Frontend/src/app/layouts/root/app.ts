import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UserManagementComponent } from '../../features/users/user-management.component';

@Component({
  selector: 'app-root',
  imports: [UserManagementComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
