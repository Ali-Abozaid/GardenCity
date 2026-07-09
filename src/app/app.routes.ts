import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { CashierComponent } from './features/cashier/cashier.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ManageGamesComponent } from './features/games/manage-games/manage-games.component';
import { ManageUsersComponent } from './features/users/manage-users/manage-users.component';
import { ReportsComponent } from './features/reports/reports.component';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { HomeRedirectComponent } from './layout/admin-layout/home-redirect.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'users',
        component: ManageUsersComponent,
        canActivate: [roleGuard],
        data: { roles: ['Admin'] },
      },
      {
        path: 'games',
        component: ManageGamesComponent,
        canActivate: [roleGuard],
        data: { roles: ['Admin'] },
      },
      {
        path: 'cashier',
        component: CashierComponent,
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'Cashier'] },
      },
      {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [roleGuard],
        data: { roles: ['Admin'] },
      },
      {
        path: 'reports',
        component: ReportsComponent,
        canActivate: [roleGuard],
        data: { roles: ['Admin'] },
      },
      { path: '', pathMatch: 'full', component: HomeRedirectComponent },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
