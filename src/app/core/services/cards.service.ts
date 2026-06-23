import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AddFundsRequest,
  BalanceResponse,
  CardDetailsResponse,
  DeductionRequest,
  NewTopupRequest,
  PagedCardsResponse,
  PrintCardResponse,
  ReprintRequest,
  RefundRequest,
} from '../models/card.model';

@Injectable({ providedIn: 'root' })
export class CardsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/cards`;

  getCards(page = 1, pageSize = 20, search?: string): Observable<PagedCardsResponse> {
    const params: Record<string, string | number> = { page, pageSize };

    if (search?.trim()) {
      params['search'] = search.trim();
    }

    return this.http.get<PagedCardsResponse>(`${this.baseUrl}/cards`, { params });
  }

  newTopup(request: NewTopupRequest): Observable<PrintCardResponse> {
    return this.http.post<PrintCardResponse>(`${this.baseUrl}/new-topup`, request);
  }

  addFunds(request: AddFundsRequest): Observable<PrintCardResponse> {
    return this.http.post<PrintCardResponse>(`${this.baseUrl}/add-funds`, request);
  }

  refund(request: RefundRequest): Observable<PrintCardResponse> {
    return this.http.post<PrintCardResponse>(`${this.baseUrl}/refund`, request);
  }

  deduct(request: DeductionRequest): Observable<PrintCardResponse> {
    return this.http.post<PrintCardResponse>(`${this.baseUrl}/deduct`, request);
  }

  checkBalance(cardNumber: string): Observable<BalanceResponse> {
    return this.http.get<BalanceResponse>(`${this.baseUrl}/balance`, {
      params: { cardId: cardNumber },
    });
  }

  reprint(request: ReprintRequest): Observable<PrintCardResponse> {
    return this.http.post<PrintCardResponse>(`${this.baseUrl}/reprint`, request);
  }

  getCardDetails(cardNumber: string): Observable<CardDetailsResponse> {
    return this.http.get<CardDetailsResponse>(`${this.baseUrl}/cards/${cardNumber}`);
  }
}
