import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApplicationRole, CurrentUserResponse } from '../models/user.model';
import { getHomeRouteForRole } from '../../layout/admin-layout/nav.config';

export { getHomeRouteForRole as getDefaultRouteForRole };

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  token: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  token: string;
  refreshToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenKey = 'gc_access_token';
  private readonly refreshTokenKey = 'gc_refresh_token';
  private readonly currentUserState = signal<CurrentUserResponse | null>(null);

  readonly currentUser = this.currentUserState.asReadonly();

  login(credentials: LoginRequest): Observable<TokenResponse> {
    return this.http
      .post<TokenResponse>(`${environment.apiUrl}/api/users/login`, credentials)
      .pipe(tap((response) => this.storeTokens(response)));
  }

  getCurrentUser(): Observable<CurrentUserResponse> {
    return this.http.get<CurrentUserResponse>(`${environment.apiUrl}/api/users/me`);
  }

  loadCurrentUser(): Observable<CurrentUserResponse> {
    return this.getCurrentUser().pipe(tap((user) => this.setCurrentUser(user)));
  }

  setCurrentUser(user: CurrentUserResponse): void {
    this.currentUserState.set(user);
  }

  hasRole(role: ApplicationRole): boolean {
    return this.currentUserState()?.role === role;
  }

  isAdmin(): boolean {
    return this.hasRole('Admin');
  }

  refreshToken(): Observable<TokenResponse> {
    const request: RefreshTokenRequest = {
      token: localStorage.getItem(this.tokenKey) ?? '',
      refreshToken: localStorage.getItem(this.refreshTokenKey) ?? '',
    };

    return this.http
      .post<TokenResponse>(`${environment.apiUrl}/api/users/refresh`, request)
      .pipe(tap((response) => this.storeTokens(response)));
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    this.currentUserState.set(null);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  private storeTokens(response: TokenResponse): void {
    localStorage.setItem(this.tokenKey, response.token);
    localStorage.setItem(this.refreshTokenKey, response.refreshToken);
  }
}
