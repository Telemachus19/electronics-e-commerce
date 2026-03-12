import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  ApiItemResponse,
  ApiListResponse,
  Role,
  User,
} from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly usersApiUrl = '/api/users';
  private readonly rolesApiUrl = '/api/roles';

  getUsers() {
    return this.http.get<ApiListResponse<User>>(this.usersApiUrl);
  }

  getRoles() {
    return this.http.get<ApiListResponse<Role>>(this.rolesApiUrl);
  }

  updateUserRole(userId: string, roleId: string) {
    return this.http.put<ApiItemResponse<User>>(`${this.usersApiUrl}/${userId}`, {
      role: roleId,
    });
  }

  setUserRestriction(userId: string, isRestricted: boolean) {
    return this.http.patch<ApiItemResponse<User>>(
      `${this.usersApiUrl}/${userId}/restriction`,
      { isRestricted },
    );
  }

  softDeleteUser(userId: string) {
    return this.http.delete<{ message: string }>(`${this.usersApiUrl}/${userId}`);
  }
}
