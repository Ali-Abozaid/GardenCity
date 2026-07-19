export interface PrintCardResponse {
  cardNumber: string;
  issuedBy: string;
  remainingBalance: number;
  currency: string;
  createdAtUtc: string;
  updatedAtUtc: string | null;
  cardTransactionType: string | null;
  amount: number | null;
}

export interface BalanceResponse {
  cardNumber: string;
  balance: number;
  currency: string;
  updatedAtUtc: string | null;
}

export interface CardTransactionItem {
  id: string;
  amount: number;
  quantity: number;
  currency: string;
  type: string;
  gameNameAr: string | null;
  gameNameEn: string | null;
  issuedBy: string | null;
  createdAtUtc: string;
  updatedAtUtc: string | null;
}

export interface CardDetailsResponse {
  cardNumber: string;
  holderName: string;
  holderPhoneNumber: string;
  balance: number;
  currency: string;
  createdAtUtc: string;
  updatedAtUtc: string | null;
  refundsCount: number;
  gamesPlayedCount: number;
  gamesDeductionAmount: number;
  transactions: CardTransactionItem[];
}

export interface CardSummaryResponse {
  cardNumber: string;
  holderName: string;
  holderPhoneNumber: string;
  balance: number;
  createdAtUtc: string;
  refundsAmount: number;
  gamesPlayedCount: number;
  gameDeductionAmount: number;
}

export interface PagedCardsResponse {
  page: number;
  pageSize: number;
  totalCount: number;
  items: CardSummaryResponse[];
}

export interface NewTopupRequest {
  holderName: string;
  holderPhoneNumber: string;
  amount: number;
}

export interface AddFundsRequest {
  cardNumber: string;
  amount: number;
}

export interface ReprintRequest {
  cardNumber?: string | null;
  holderPhoneNumber?: string | null;
}

export interface RefundRequest {
  cardNumber: string;
  amount: number;
}

export interface DeductionRequest {
  cardNumber: string;
  gameId: string;
  quantity: number;
}

export type CashierTab = 'new-topup' | 'add-funds' | 'reprint' | 'lookup';

export const CASHIER_TABS: { id: CashierTab; label: string; description: string }[] = [
  { id: 'new-topup', label: 'بطاقة جديدة', description: 'إصدار بطاقة عائلة مع شحن أولي' },
  { id: 'add-funds', label: 'إضافة رصيد', description: 'شحن بطاقة موجودة' },
  { id: 'reprint', label: 'إعادة طباعة', description: 'طباعة رمز QR للبطاقة' },
  { id: 'lookup', label: 'استعلام', description: 'عرض تفاصيل البطاقة والمعاملات' },
];

export interface ReportQueryParams {
  cashierId?: string;
  fromDate: string;
  toDate: string;
}

export interface CashierReportResponse {
  totalAmount: number;
  totalTransactions: number;
  currency?: string;
}

export interface RefundReportResponse {
  totalAmount: number;
  totalRefunds: number;
  currency?: string;
}

export interface CardTransactionsQueryParams {
  pageIndex?: number;
  pageSize?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface CardTransactionReportItem {
  id: string;
  cardNumber: string;
  holderName: string;
  holderPhoneNumber: string;
  amount: number;
  quantity: number;
  currency: string;
  issuerName: string | null;
  createdAtUtc: string;
}

export interface PagedCardTransactionsResponse {
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  items: CardTransactionReportItem[];
}
