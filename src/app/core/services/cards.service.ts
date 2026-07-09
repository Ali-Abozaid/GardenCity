import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AddFundsRequest,
  BalanceResponse,
  CardDetailsResponse,
  CashierReportResponse,
  DeductionRequest,
  NewTopupRequest,
  PagedCardsResponse,
  PrintCardResponse,
  RefundReportResponse,
  ReportQueryParams,
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

  getCashierReport(params: ReportQueryParams): Observable<CashierReportResponse> {
    return this.http
      .get<Record<string, unknown>>(`${this.baseUrl}/cashier-report`, {
        params: this.buildReportParams(params),
      })
      .pipe(map((response) => this.normalizeCashierReport(response)));
  }

  getRefundReport(params: ReportQueryParams): Observable<RefundReportResponse> {
    return this.http
      .get<Record<string, unknown>>(`${this.baseUrl}/refund-report`, {
        params: this.buildReportParams(params),
      })
      .pipe(map((response) => this.normalizeRefundReport(response)));
  }

  private normalizeCashierReport(data: Record<string, unknown>): CashierReportResponse {
    return {
      totalAmount: this.readNumber(
        data,
        'totalAmount',
        'TotalAmount',
        'totalAmountTransactions',
        'TotalAmountTransactions',
      ),
      totalTransactions: this.readNumber(
        data,
        'totalTransactions',
        'TotalTransactions',
        'totalNumberOfTransactions',
        'TotalNumberOfTransactions',
      ),
      currency: this.readString(data, 'currency', 'Currency'),
    };
  }

  private normalizeRefundReport(data: Record<string, unknown>): RefundReportResponse {
    return {
      totalAmount: this.readNumber(
        data,
        'totalAmount',
        'TotalAmount',
        'totalAmountRefunds',
        'TotalAmountRefunds',
      ),
      totalRefunds: this.readNumber(
        data,
        'totalRefunds',
        'TotalRefunds',
        'totalNumberOfRefunds',
        'TotalNumberOfRefunds',
      ),
      currency: this.readString(data, 'currency', 'Currency'),
    };
  }

  private readNumber(data: Record<string, unknown>, ...keys: string[]): number {
    for (const key of keys) {
      const value = data[key];
      if (typeof value === 'number' && !Number.isNaN(value)) {
        return value;
      }

      if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value);
        if (!Number.isNaN(parsed)) {
          return parsed;
        }
      }
    }

    return 0;
  }

  private readString(data: Record<string, unknown>, ...keys: string[]): string | undefined {
    for (const key of keys) {
      const value = data[key];
      if (typeof value === 'string' && value.trim()) {
        return value;
      }
    }

    return undefined;
  }

  private buildReportParams(params: ReportQueryParams): HttpParams {
    let httpParams = new HttpParams()
      .set('FromDate', params.fromDate)
      .set('ToDate', params.toDate);

    if (params.cashierId?.trim()) {
      httpParams = httpParams.set('CashierId', params.cashierId.trim());
    }

    return httpParams;
  }
}
