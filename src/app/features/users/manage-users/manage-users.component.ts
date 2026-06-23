import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import {
  ApplicationRole,
  getRoleLabel,
  ROLE_OPTIONS,
  UserResponse,
} from '../../../core/models/user.model';
import { UsersService } from '../../../core/services/users.service';

@Component({
  selector: 'app-manage-users',
  imports: [ReactiveFormsModule],
  templateUrl: './manage-users.component.html',
  styleUrl: './manage-users.component.css',
})
export class ManageUsersComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly usersService = inject(UsersService);
  private readonly search$ = new Subject<string>();

  protected readonly roleOptions = ROLE_OPTIONS;
  protected readonly getRoleLabel = getRoleLabel;

  protected readonly users = signal<UserResponse[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly showAddForm = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly updatingRoleFor = signal<string | null>(null);
  protected readonly deletingUserId = signal<string | null>(null);

  protected readonly searchControl = this.fb.nonNullable.control('');

  protected readonly addForm = this.fb.nonNullable.group({
    displayedName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: ['Cashier' as ApplicationRole, Validators.required],
  });

  ngOnInit(): void {
    this.loadUsers();

    this.search$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((search) => {
          this.isLoading.set(true);
          return this.usersService.getUsers(search);
        }),
      )
      .subscribe({
        next: (response) => {
          this.users.set(response.items);
          this.totalCount.set(response.totalCount);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.errorMessage.set('تعذر تحميل قائمة المستخدمين.');
        },
      });
  }

  protected onSearchInput(): void {
    this.search$.next(this.searchControl.value);
  }

  protected loadUsers(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.usersService.getUsers(this.searchControl.value).subscribe({
      next: (response) => {
        this.users.set(response.items);
        this.totalCount.set(response.totalCount);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('تعذر تحميل قائمة المستخدمين.');
      },
    });
  }

  protected toggleAddForm(): void {
    this.showAddForm.update((value) => !value);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    if (!this.showAddForm()) {
      this.addForm.reset({ role: 'Cashier' });
    }
  }

  protected addUser(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (this.addForm.invalid) {
      this.addForm.markAllAsTouched();
      this.errorMessage.set('أكمل جميع الحقول المطلوبة: الاسم، البريد، كلمة المرور (8 أحرف)، والدور.');
      return;
    }

    this.isSaving.set(true);

    this.usersService.registerUser(this.addForm.getRawValue()).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.successMessage.set('تم إضافة المستخدم بنجاح.');
        this.addForm.reset({ role: 'Cashier' });
        this.showAddForm.set(false);
        this.loadUsers();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.errorMessage.set(this.getApiErrorMessage(err));
      },
    });
  }

  private getApiErrorMessage(error: unknown): string {
    const body = (error as { error?: { errors?: Record<string, string[]>; title?: string } })?.error;

    if (body?.errors) {
      const messages = Object.values(body.errors).flat().filter(Boolean);
      if (messages.length > 0) {
        return messages.join(' ');
      }
    }

    if (body?.title) {
      return body.title;
    }

    return 'تعذر إضافة المستخدم. تحقق من البيانات أو أن البريد غير مستخدم.';
  }

  protected onRoleChange(user: UserResponse, newRole: ApplicationRole): void {
    if (!newRole || newRole === user.role) {
      return;
    }

    this.updatingRoleFor.set(user.id);
    this.errorMessage.set(null);

    this.usersService.updateUserRole(user.id, newRole).subscribe({
      next: () => {
        this.updatingRoleFor.set(null);
        this.successMessage.set(`تم تحديث دور ${user.displayName}.`);
        this.loadUsers();
      },
      error: () => {
        this.updatingRoleFor.set(null);
        this.errorMessage.set('تعذر تحديث دور المستخدم.');
        this.loadUsers();
      },
    });
  }

  protected deleteUser(user: UserResponse): void {
    const confirmed = confirm(`هل تريد حذف المستخدم "${user.displayName}"؟`);

    if (!confirmed) {
      return;
    }

    this.deletingUserId.set(user.id);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.usersService.deleteUser(user.id).subscribe({
      next: () => {
        this.deletingUserId.set(null);
        this.successMessage.set(`تم حذف ${user.displayName} بنجاح.`);
        this.loadUsers();
      },
      error: () => {
        this.deletingUserId.set(null);
        this.errorMessage.set('تعذر حذف المستخدم.');
        this.loadUsers();
      },
    });
  }
}
