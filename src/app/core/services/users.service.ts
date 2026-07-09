import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApplicationRole,
  PagedUsersResponse,
  RegisterUserApiRequest,
  RegisterUserRequest,
  ROLE_API_VALUES,
  UpdateUserRequest,
  UpdateUserRoleApiRequest,
  UserResponse,
} from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/users`;

  getUsers(search?: string): Observable<PagedUsersResponse> {
    let params = new HttpParams();

    if (search?.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<PagedUsersResponse>(this.baseUrl, { params });
  }

  getCashiers(): Observable<UserResponse[]> {
    return this.getUsers().pipe(
      map((response) =>
        response.items.filter((user) => user.role === 'Cashier' || user.role === 'Admin'),
      ),
    );
  }

  getUserById(userId: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.baseUrl}/${userId}`);
  }

  registerUser(request: RegisterUserRequest): Observable<UserResponse> {
    const payload: RegisterUserApiRequest = {
      email: request.email.trim(),
      password: request.password,
      role: ROLE_API_VALUES[request.role],
      displayedName: request.displayedName.trim(),
    };

    return this.http.post<UserResponse>(`${this.baseUrl}/register`, payload);
  }

  updateUser(userId: string, request: UpdateUserRequest): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.baseUrl}/${userId}`, request);
  }

  updateUserRole(userId: string, newRole: ApplicationRole): Observable<void> {
    const payload: UpdateUserRoleApiRequest = {
      newRole: ROLE_API_VALUES[newRole],
    };

    return this.http.post<void>(`${this.baseUrl}/${userId}/role`, payload);
  }

  deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${userId}`);
  }
}
