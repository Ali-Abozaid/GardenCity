import { Component, computed, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { getRoleLabel } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { getNavItemsForRole } from './nav.config';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css',
})
export class AdminLayoutComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly currentUser = this.auth.currentUser;
  protected readonly getRoleLabel = getRoleLabel;

  protected readonly navItems = computed(() =>
    getNavItemsForRole(this.currentUser()?.role),
  );

  protected readonly profileInitial = computed(() => {
    const name = this.currentUser()?.displayedName?.trim();
    return name ? name.charAt(0) : '؟';
  });

  ngOnInit(): void {
    if (!this.auth.currentUser()) {
      this.auth.loadCurrentUser().subscribe({
        error: () => {
          this.auth.logout();
          this.router.navigate(['/login']);
        },
      });
    }
  }

  protected logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
