import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, of } from 'rxjs';
import {
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

  protected readonly cashiers = signal<UserResponse[]>([]);
  protected readonly getRoleLabel = getRoleLabel;
  protected readonly cashierReport = signal<CashierReportResponse | null>(null);
  protected readonly refundReport = signal<RefundReportResponse | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly hasSearched = signal(false);

  protected readonly filterForm = this.fb.nonNullable.group({
    cashierId: [''],
    fromDate: ['', Validators.required],
    toDate: ['', Validators.required],
  });

  ngOnInit(): void {
    this.setDefaultDateRange();
    this.loadCashiers();
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
      .pipe(catchError(() => {
        this.errorMessage.set('تعذر تحميل تقرير الكاشير.');
        return of(null);
      }))
      .subscribe((report) => {
        if (report) {
          this.cashierReport.set(report);
        }
        finishRequest();
      });

    this.cardsService
      .getRefundReport(params)
      .pipe(catchError(() => {
        if (!this.errorMessage()) {
          this.errorMessage.set('تعذر تحميل تقرير الاسترداد.');
        }
        return of(null);
      }))
      .subscribe((report) => {
        if (report) {
          this.refundReport.set(report);
        }
        finishRequest();
      });
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

  private setDefaultDateRange(): void {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    this.filterForm.patchValue({
      fromDate: this.toInputDateTime(start, false),
      toDate: this.toInputDateTime(now, true),
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

  private getApiErrorMessage(error: unknown): string {
    const body = (error as { error?: { title?: string; errors?: Record<string, string[]> } })?.error;

    if (body?.errors) {
      const messages = Object.values(body.errors).flat().filter(Boolean);
      if (messages.length > 0) {
        return messages.join(' ');
      }
    }

    if (body?.title) {
      return body.title;
    }

    return 'تعذر تحميل التقارير. تحقق من الفلاتر وحاول مرة أخرى.';
  }
}
