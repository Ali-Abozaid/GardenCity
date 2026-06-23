import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateGameRequest,
  GameBoyOption,
  GameResponse,
  UpdateGameRequest,
} from '../models/game.model';
import { UsersService } from './users.service';

@Injectable({ providedIn: 'root' })
export class GamesService {
  private readonly http = inject(HttpClient);
  private readonly usersService = inject(UsersService);
  private readonly baseUrl = `${environment.apiUrl}/api/games`;

  getGames(search?: string): Observable<GameResponse[]> {
    let params = new HttpParams();

    if (search?.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<GameResponse[]>(this.baseUrl, { params });
  }

  getGameById(gameId: string): Observable<GameResponse> {
    return this.http.get<GameResponse>(`${this.baseUrl}/${gameId}`);
  }

  getGameBoyOperators(): Observable<GameBoyOption[]> {
    return this.usersService.getUsers().pipe(
      map((response) =>
        response.items
          .filter((user) => user.role === 'GameBoy')
          .map((user) => ({ id: user.id, name: user.displayName })),
      ),
    );
  }

  createGame(request: CreateGameRequest): Observable<GameResponse> {
    return this.http.post<GameResponse>(this.baseUrl, request);
  }

  updateGame(gameId: string, request: UpdateGameRequest): Observable<GameResponse> {
    return this.http.put<GameResponse>(`${this.baseUrl}/${gameId}`, request);
  }

  deleteGame(gameId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${gameId}`);
  }
}
