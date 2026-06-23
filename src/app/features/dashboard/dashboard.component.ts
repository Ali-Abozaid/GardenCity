import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="dashboard-placeholder" dir="rtl">
      <h1>مرحبًا بك في لوحة تحكم جاردن سيتي</h1>
      <p>تم تسجيل الدخول بنجاح. سيتم إضافة بقية الصفحات قريبًا.</p>
    </div>
  `,
  styles: `
    .dashboard-placeholder {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 2rem;
      background: var(--gc-bg);
      text-align: center;
    }

    h1 {
      margin: 0;
      color: var(--gc-plum);
      font-size: 1.75rem;
    }

    p {
      margin: 0;
      color: var(--gc-text-secondary);
    }
  `,
})
export class DashboardComponent {}
