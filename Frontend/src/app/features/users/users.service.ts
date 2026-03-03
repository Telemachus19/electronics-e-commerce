import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiListResponse, User } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly usersApiUrl = 'http://localhost:5000/api/users';

  getUsers() {
    return this.http.get<ApiListResponse<User>>(this.usersApiUrl);
  }
}
