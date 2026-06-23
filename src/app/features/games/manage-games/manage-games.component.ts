import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { GameBoyOption, GameResponse } from '../../../core/models/game.model';
import { GamesService } from '../../../core/services/games.service';

@Component({
  selector: 'app-manage-games',
  imports: [ReactiveFormsModule],
  templateUrl: './manage-games.component.html',
  styleUrl: './manage-games.component.css',
})
export class ManageGamesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly gamesService = inject(GamesService);
  private readonly search$ = new Subject<string>();

  protected readonly games = signal<GameResponse[]>([]);
  protected readonly gameBoyOptions = signal<GameBoyOption[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly showForm = signal(false);
  protected readonly editingGameId = signal<string | null>(null);
  protected readonly deletingGameId = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  protected readonly searchControl = this.fb.nonNullable.control('');

  protected readonly gameForm = this.fb.nonNullable.group({
    nameAr: ['', [Validators.required, Validators.minLength(2)]],
    nameEn: ['', [Validators.required, Validators.minLength(2)]],
    price: [0, [Validators.required, Validators.min(1)]],
    isActive: [true],
    gameBoyId: [''],
  });

  ngOnInit(): void {
    this.loadGameBoyOperators();
    this.loadGames();

    this.search$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((search) => {
          this.isLoading.set(true);
          return this.gamesService.getGames(search);
        }),
      )
      .subscribe({
        next: (games) => {
          this.games.set(games);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.errorMessage.set('تعذر تحميل قائمة الألعاب.');
        },
      });
  }

  protected get isEditing(): boolean {
    return this.editingGameId() !== null;
  }

  protected onSearchInput(): void {
    this.search$.next(this.searchControl.value);
  }

  protected loadGames(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.gamesService.getGames(this.searchControl.value).subscribe({
      next: (games) => {
        this.games.set(games);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('تعذر تحميل قائمة الألعاب.');
      },
    });
  }

  protected loadGameBoyOperators(): void {
    this.gamesService.getGameBoyOperators().subscribe({
      next: (operators) => this.gameBoyOptions.set(operators),
    });
  }

  protected openCreateForm(): void {
    this.editingGameId.set(null);
    this.showForm.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.gameForm.reset({
      nameAr: '',
      nameEn: '',
      price: 0,
      isActive: true,
      gameBoyId: '',
    });
  }

  protected openEditForm(game: GameResponse): void {
    this.editingGameId.set(game.id);
    this.showForm.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.gameForm.reset({
      nameAr: game.nameAr,
      nameEn: game.nameEn,
      price: game.price,
      isActive: game.isActive,
      gameBoyId: game.gameBoyId ?? '',
    });
  }

  protected closeForm(): void {
    this.showForm.set(false);
    this.editingGameId.set(null);
    this.gameForm.reset({
      nameAr: '',
      nameEn: '',
      price: 0,
      isActive: true,
      gameBoyId: '',
    });
  }

  protected saveGame(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (this.gameForm.invalid) {
      this.gameForm.markAllAsTouched();
      return;
    }

    const raw = this.gameForm.getRawValue();
    const gameBoyId = raw.gameBoyId || null;
    this.isSaving.set(true);

    const request = {
      nameAr: raw.nameAr,
      nameEn: raw.nameEn,
      price: raw.price,
      isActive: raw.isActive,
      gameBoyId,
    };

    const save$ = this.isEditing
      ? this.gamesService.updateGame(this.editingGameId()!, request)
      : this.gamesService.createGame(request);

    save$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.successMessage.set(
          this.isEditing ? 'تم تحديث اللعبة بنجاح.' : 'تم إضافة اللعبة بنجاح.',
        );
        this.closeForm();
        this.loadGames();
      },
      error: () => {
        this.isSaving.set(false);
        this.errorMessage.set(
          this.isEditing ? 'تعذر تحديث اللعبة.' : 'تعذر إضافة اللعبة.',
        );
      },
    });
  }

  protected deleteGame(game: GameResponse): void {
    const confirmed = confirm(`هل تريد حذف اللعبة "${game.nameAr}"؟`);

    if (!confirmed) {
      return;
    }

    this.deletingGameId.set(game.id);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.gamesService.deleteGame(game.id).subscribe({
      next: () => {
        this.deletingGameId.set(null);
        this.successMessage.set(`تم حذف ${game.nameAr} بنجاح.`);

        if (this.editingGameId() === game.id) {
          this.closeForm();
        }

        this.loadGames();
      },
      error: () => {
        this.deletingGameId.set(null);
        this.errorMessage.set('تعذر حذف اللعبة.');
      },
    });
  }
}
