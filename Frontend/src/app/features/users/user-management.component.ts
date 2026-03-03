import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { UsersService } from './users.service';
import { User } from '../../shared/models/user.model';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserManagementComponent implements OnInit {
  private readonly usersService = inject(UsersService);

  protected readonly users = signal<User[]>([]);
  protected readonly isLoading = signal(true);

  ngOnInit(): void {
    this.usersService.getUsers().subscribe({
      next: (response) => {
        this.users.set(response.data);
        this.isLoading.set(false);
      },
      error: () => {
        this.users.set([]);
        this.isLoading.set(false);
      }
    });
  }

  protected initials(user: User): string {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }

  protected userCode(index: number): string {
    return `USR-${String(index + 1).padStart(3, '0')}`;
  }
}