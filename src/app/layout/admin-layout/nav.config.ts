import { ApplicationRole } from '../../core/models/user.model';

export type NavIcon = 'cashier' | 'users' | 'games' | 'dashboard';

export interface NavItem {
  label: string;
  route: string;
  icon: NavIcon;
  roles: ApplicationRole[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'نافذة الكاشير',
    route: '/cashier',
    icon: 'cashier',
    roles: ['Admin', 'Cashier'],
  },
  {
    label: 'إدارة المستخدمين',
    route: '/users',
    icon: 'users',
    roles: ['Admin'],
  },
  {
    label: 'إدارة الألعاب',
    route: '/games',
    icon: 'games',
    roles: ['Admin'],
  },
  {
    label: 'لوحة التحكم',
    route: '/dashboard',
    icon: 'dashboard',
    roles: ['Admin'],
  },
];

export function getNavItemsForRole(role: string | null | undefined): NavItem[] {
  if (!role) {
    return [];
  }

  return NAV_ITEMS.filter((item) => item.roles.includes(role as ApplicationRole));
}

export function getHomeRouteForRole(role: string | null | undefined): string {
  const items = getNavItemsForRole(role);
  return items[0]?.route ?? '/login';
}
