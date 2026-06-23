export type ApplicationRole =
  | 'Admin'
  | 'Cashier'
  | 'GameBoy'
  | 'RefundBoy'
  | 'BalanceChecker';

export interface UserResponse {
  id: string;
  email: string;
  displayName: string;
  role: string | null;
}

export interface PagedUsersResponse {
  page: number;
  pageSize: number;
  totalCount: number;
  items: UserResponse[];
}

export interface CurrentUserGameResponse {
  id: string;
  nameAr: string;
  nameEn: string;
}

export interface CurrentUserResponse {
  userId: string;
  email: string;
  displayedName: string;
  role: ApplicationRole | string | null;
  game: CurrentUserGameResponse | null;
}

export interface RegisterUserRequest {
  email: string;
  password: string;
  role: ApplicationRole;
  displayedName: string;
}

export interface UpdateUserRequest {
  email: string;
  role: ApplicationRole | null;
}

export interface UpdateUserRoleRequest {
  newRole: ApplicationRole;
}

export const ROLE_OPTIONS: { value: ApplicationRole; label: string }[] = [
  { value: 'Admin', label: 'مسؤول' },
  { value: 'Cashier', label: 'كاشير' },
  { value: 'GameBoy', label: 'مسؤول اللعبة' },
  { value: 'RefundBoy', label: 'موظف الاسترداد' },
  { value: 'BalanceChecker', label: 'فاحص الرصيد' },
];

/** Matches backend ApplicationRole enum numeric values. */
export const ROLE_API_VALUES: Record<ApplicationRole, number> = {
  Admin: 0,
  Cashier: 1,
  GameBoy: 2,
  RefundBoy: 3,
  BalanceChecker: 4,
};

export interface RegisterUserApiRequest {
  email: string;
  password: string;
  role: number;
  displayedName: string;
}

export interface UpdateUserRoleApiRequest {
  newRole: number;
}

export function getRoleLabel(role: string | null | undefined): string {
  if (!role) {
    return '—';
  }

  return ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;
}
