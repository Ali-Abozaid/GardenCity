import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, debounceTime, distinctUntilChanged, of, Subject, switchMap } from 'rxjs';
import {
  CardTransactionReportItem,
  CashierReportResponse,
  RefundReportResponse,
} from '../../core/models/card.model';
import { UserResponse, getRoleLabel } from '../../core/models/user.model';
import { CardsService } from '../../core/services/cards.service';
import { UsersService } from '../../core/services/users.service';

@Component({
  selector: 'app-reports',
  imports: [ReactiveFormsModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css',
})
export class ReportsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly cardsService = inject(CardsService);
  private readonly usersService = inject(UsersService);
  private readonly transactionsSearch$ = new Subject<string>();

  protected readonly cashiers = signal<UserResponse[]>([]);
  protected readonly getRoleLabel = getRoleLabel;
  protected readonly cashierReport = signal<CashierReportResponse | null>(null);
  protected readonly refundReport = signal<RefundReportResponse | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly hasSearched = signal(false);

  protected readonly transactions = signal<CardTransactionReportItem[]>([]);
  protected readonly transactionsTotal = signal(0);
  protected readonly transactionsPage = signal(1);
  protected readonly transactionsPageSize = 20;
  protected readonly isLoadingTransactions = signal(false);
  protected readonly transactionsError = signal<string | null>(null);
  protected readonly transactionsSearch = this.fb.nonNullable.control('');
  protected readonly transactionsDateForm = this.fb.nonNullable.group({
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
  });

  protected readonly transactionsTotalPages = computed(() => {
    const total = this.transactionsTotal();
    return Math.max(1, Math.ceil(total / this.transactionsPageSize));
  });

  protected readonly filterForm = this.fb.nonNullable.group({
    cashierId: [''],
    fromDate: ['', Validators.required],
    toDate: ['', Validators.required],
  });

  ngOnInit(): void {
    this.setDefaultDateRange();
    this.setDefaultTransactionsDateRange();
    this.loadCashiers();
    this.setupTransactionsSearch();
    this.loadCardTransactions(1);
  }

  protected loadReports(): void {
    this.errorMessage.set(null);
    this.cashierReport.set(null);
    this.refundReport.set(null);

    if (this.filterForm.invalid) {
      this.filterForm.markAllAsTouched();
      this.errorMessage.set('اختر تاريخ البداية والنهاية.');
      return;
    }

    const raw = this.filterForm.getRawValue();
    const fromDate = this.toApiDateTime(raw.fromDate, false);
    const toDate = this.toApiDateTime(raw.toDate, true);

    if (new Date(fromDate) > new Date(toDate)) {
      this.errorMessage.set('تاريخ البداية يجب أن يكون قبل تاريخ النهاية.');
      return;
    }

    this.isLoading.set(true);
    this.hasSearched.set(true);

    const params = {
      cashierId: raw.cashierId || undefined,
      fromDate,
      toDate,
    };

    let completedRequests = 0;

    const finishRequest = (): void => {
      completedRequests += 1;
      if (completedRequests === 2) {
        this.isLoading.set(false);
      }
    };

    this.cardsService
      .getCashierReport(params)
      .pipe(
        catchError(() => {
          this.errorMessage.set('تعذر تحميل تقرير الكاشير.');
          return of(null);
        }),
      )
      .subscribe((report) => {
        if (report) {
          this.cashierReport.set(report);
        }
        finishRequest();
      });

    this.cardsService
      .getRefundReport(params)
      .pipe(
        catchError(() => {
          if (!this.errorMessage()) {
            this.errorMessage.set('تعذر تحميل تقرير الاسترداد.');
          }
          return of(null);
        }),
      )
      .subscribe((report) => {
        if (report) {
          this.refundReport.set(report);
        }
        finishRequest();
      });
  }

  protected onTransactionsSearchInput(): void {
    this.transactionsSearch$.next(this.transactionsSearch.value);
  }

  protected applyTransactionsFilters(): void {
    this.transactionsError.set(null);

    if (this.transactionsDateForm.invalid) {
      this.transactionsDateForm.markAllAsTouched();
      this.transactionsError.set('اختر تاريخ البداية والنهاية لمعاملات البطاقات.');
      return;
    }

    const { startDate, endDate } = this.getTransactionsDateRange();
    if (new Date(startDate) > new Date(endDate)) {
      this.transactionsError.set('تاريخ البداية يجب أن يكون قبل تاريخ النهاية.');
      return;
    }

    this.loadCardTransactions(1);
  }

  protected goToTransactionsPage(page: number): void {
    const totalPages = this.transactionsTotalPages();
    if (page < 1 || page > totalPages || page === this.transactionsPage()) {
      return;
    }

    this.loadCardTransactions(page);
  }

  protected formatAmountValue(amount: number): string {
    return amount.toLocaleString('ar-SA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  protected formatCurrencyCode(currency = 'SAR'): string {
    return currency;
  }

  protected formatDate(value: string): string {
    if (!value) {
      return '—';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private setupTransactionsSearch(): void {
    this.transactionsSearch$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((search) => {
          this.isLoadingTransactions.set(true);
          this.transactionsError.set(null);
          this.transactionsPage.set(1);

          return this.cardsService
            .getCardTransactions({
              pageIndex: 1,
              pageSize: this.transactionsPageSize,
              search,
              ...this.getOptionalTransactionsDateParams(),
            })
            .pipe(
              catchError(() => {
                this.transactionsError.set('تعذر تحميل معاملات البطاقات.');
                return of(null);
              }),
            );
        }),
      )
      .subscribe((response) => {
        this.isLoadingTransactions.set(false);
        if (!response) {
          return;
        }

        this.transactions.set(response.items);
        this.transactionsTotal.set(response.totalCount);
        this.transactionsPage.set(response.pageIndex);
      });
  }

  private loadCardTransactions(pageIndex: number): void {
    this.isLoadingTransactions.set(true);
    this.transactionsError.set(null);

    this.cardsService
      .getCardTransactions({
        pageIndex,
        pageSize: this.transactionsPageSize,
        search: this.transactionsSearch.value,
        ...this.getOptionalTransactionsDateParams(),
      })
      .subscribe({
        next: (response) => {
          this.isLoadingTransactions.set(false);
          this.transactions.set(response.items);
          this.transactionsTotal.set(response.totalCount);
          this.transactionsPage.set(response.pageIndex);
        },
        error: () => {
          this.isLoadingTransactions.set(false);
          this.transactionsError.set('تعذر تحميل معاملات البطاقات.');
        },
      });
  }

  private getOptionalTransactionsDateParams(): { startDate?: string; endDate?: string } {
    if (this.transactionsDateForm.invalid) {
      return {};
    }

    return this.getTransactionsDateRange();
  }

  private getTransactionsDateRange(): { startDate: string; endDate: string } {
    const raw = this.transactionsDateForm.getRawValue();
    return {
      startDate: this.toApiDateTime(raw.startDate, false),
      endDate: this.toApiDateTime(raw.endDate, true),
    };
  }

  private setDefaultDateRange(): void {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    this.filterForm.patchValue({
      fromDate: this.toInputDateTime(start, false),
      toDate: this.toInputDateTime(now, true),
    });
  }

  private setDefaultTransactionsDateRange(): void {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    this.transactionsDateForm.patchValue({
      startDate: this.toInputDateTime(start, false),
      endDate: this.toInputDateTime(now, true),
    });
  }

  private loadCashiers(): void {
    this.usersService.getCashiers().subscribe({
      next: (cashiers) => this.cashiers.set(cashiers),
      error: () => this.errorMessage.set('تعذر تحميل قائمة الكاشير.'),
    });
  }

  private toInputDateTime(date: Date, endOfDay: boolean): string {
    const value = new Date(date);
    if (endOfDay) {
      value.setHours(23, 59, 0, 0);
    } else {
      value.setHours(0, 0, 0, 0);
    }

    const pad = (n: number) => String(n).padStart(2, '0');
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
  }

  private toApiDateTime(value: string, endOfDay: boolean): string {
    const date = new Date(value);
    if (endOfDay) {
      date.setSeconds(59, 999);
    } else {
      date.setSeconds(0, 0);
    }

    return date.toISOString();
  }
}
