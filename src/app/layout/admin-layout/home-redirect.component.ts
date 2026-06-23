import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { getHomeRouteForRole } from './nav.config';

@Component({
  selector: 'app-home-redirect',
  template: '',
})
export class HomeRedirectComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    const cachedUser = this.auth.currentUser();
    if (cachedUser) {
      void this.router.navigateByUrl(getHomeRouteForRole(cachedUser.role));
      return;
    }

    this.auth.loadCurrentUser().subscribe({
      next: (user) => void this.router.navigateByUrl(getHomeRouteForRole(user.role)),
      error: () => {
        this.auth.logout();
        void this.router.navigate(['/login']);
      },
    });
  }
}
