import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { UsersService } from './users.service';
import { Role, User } from '../../shared/models/user.model';

@Component({
  selector: 'app-user-management',
  imports: [],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserManagementComponent implements OnInit {
  private readonly usersService = inject(UsersService);

  protected readonly users = signal<User[]>([]);
  protected readonly roles = signal<Role[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly actionInProgressByUserId = signal<Record<string, boolean>>({});
  protected readonly selectedRoleByUserId = signal<Record<string, string>>({});
  protected readonly roleEditorOpenByUserId = signal<Record<string, boolean>>({});

  ngOnInit(): void {
    forkJoin({
      usersResponse: this.usersService.getUsers(),
      rolesResponse: this.usersService.getRoles(),
    }).subscribe({
      next: ({ usersResponse, rolesResponse }) => {
        this.users.set(usersResponse.data);
        this.roles.set(rolesResponse.data);

        const roleMap = usersResponse.data.reduce<Record<string, string>>((acc, user) => {
          acc[user._id] = user.role._id;
          return acc;
        }, {});

        this.selectedRoleByUserId.set(roleMap);
        this.isLoading.set(false);
      },
      error: () => {
        this.users.set([]);
        this.roles.set([]);
        this.isLoading.set(false);
      },
    });
  }

  protected initials(user: User): string {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }

  protected userCode(index: number): string {
    return `USR-${String(index + 1).padStart(3, '0')}`;
  }

  protected statusLabel(user: User): string {
    if (user.isRestricted === true) {
      return 'Restricted';
    }

    if (user.isApproved === false) {
      return 'Pending Approval';
    }

    return 'Active';
  }

  protected statusClass(user: User): string {
    if (user.isRestricted === true) {
      return 'status-restricted';
    }

    if (user.isApproved === false) {
      return 'status-pending-approval';
    }

    return 'status-active';
  }

  protected isActionInProgress(userId: string): boolean {
    return !!this.actionInProgressByUserId()[userId];
  }

  protected selectedRoleId(userId: string): string {
    return this.selectedRoleByUserId()[userId] ?? '';
  }

  protected isRoleEditorOpen(userId: string): boolean {
    return this.roleEditorOpenByUserId()[userId] === true;
  }

  protected openRoleEditor(user: User): void {
    this.onRoleSelectionChange(user._id, user.role._id);
    this.roleEditorOpenByUserId.update((currentState) => ({
      ...currentState,
      [user._id]: true,
    }));
  }

  protected closeRoleEditor(userId: string): void {
    this.roleEditorOpenByUserId.update((currentState) => ({
      ...currentState,
      [userId]: false,
    }));
  }

  protected onRoleSelectionChange(userId: string, roleId: string): void {
    this.selectedRoleByUserId.update((currentState) => ({
      ...currentState,
      [userId]: roleId,
    }));
  }

  protected canUpdateRole(user: User): boolean {
    const selectedRoleId = this.selectedRoleId(user._id);
    return selectedRoleId.length > 0 && selectedRoleId !== user.role._id;
  }

  protected updateRole(user: User): void {
    const nextRoleId = this.selectedRoleId(user._id);

    if (!nextRoleId || nextRoleId === user.role._id) {
      return;
    }

    this.setActionInProgress(user._id, true);

    this.usersService.updateUserRole(user._id, nextRoleId).subscribe({
      next: (response) => {
        this.replaceUser(response.data);
        this.onRoleSelectionChange(user._id, response.data.role._id);
        this.closeRoleEditor(user._id);
        this.setActionInProgress(user._id, false);
      },
      error: () => this.setActionInProgress(user._id, false),
    });
  }

  protected approveUser(userId: string): void {
    this.setActionInProgress(userId, true);

    this.usersService.approveUser(userId).subscribe({
      next: (response) => {
        this.replaceUser(response.data);
        this.setActionInProgress(userId, false);
      },
      error: () => this.setActionInProgress(userId, false),
    });
  }

  protected toggleRestriction(user: User): void {
    this.setActionInProgress(user._id, true);

    const nextRestrictionState = user.isRestricted !== true;

    this.usersService.setUserRestriction(user._id, nextRestrictionState).subscribe({
      next: (response) => {
        this.replaceUser(response.data);
        this.setActionInProgress(user._id, false);
      },
      error: () => this.setActionInProgress(user._id, false),
    });
  }

  protected softDeleteUser(userId: string): void {
    this.setActionInProgress(userId, true);

    this.usersService.softDeleteUser(userId).subscribe({
      next: () => {
        this.users.update((currentUsers) => currentUsers.filter((user) => user._id !== userId));
        this.setActionInProgress(userId, false);
      },
      error: () => this.setActionInProgress(userId, false),
    });
  }

  private replaceUser(updatedUser: User): void {
    this.users.update((currentUsers) =>
      currentUsers.map((user) => (user._id === updatedUser._id ? updatedUser : user)),
    );
  }

  private setActionInProgress(userId: string, isInProgress: boolean): void {
    this.actionInProgressByUserId.update((currentState) => ({
      ...currentState,
      [userId]: isInProgress,
    }));
  }
}
