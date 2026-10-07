import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { DraftService } from './services/draft.service';
import { QuestionService } from './services/question.service';
import { StorageService } from './services/storage.service';
import { ThemeService } from './services/theme.service';
import { isTyping } from './shared/keys';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  host: { '(document:keydown)': 'onKey($event)' },
})
export class App {
  protected readonly qs = inject(QuestionService);
  protected readonly storage = inject(StorageService);
  protected readonly theme = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly sw = inject(SwUpdate, { optional: true });
  private readonly draft = inject(DraftService); // instantiated early so the admin draft overlay is active

  protected readonly menuOpen = signal(false);
  protected readonly openGroup = signal<string | null>(null);
  protected readonly helpOpen = signal(false);
  protected readonly updateReady = signal(false);

  constructor() {
    this.qs.load();
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => this.menuOpen.set(false));

    if (this.sw?.isEnabled) {
      this.sw.versionUpdates
        .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'), takeUntilDestroyed())
        .subscribe(() => this.updateReady.set(true));
      // Check for a new deploy whenever the tab becomes visible again.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') this.sw?.checkForUpdate().catch(() => undefined);
      });
    }
  }

  protected toggleGroup(name: string): void {
    this.openGroup.update((g) => (g === name ? null : name));
  }

  protected search(value: string): void {
    const q = value.trim();
    if (!q) return;
    void this.router.navigate(['/search'], { queryParams: { q }, replaceUrl: this.router.url.startsWith('/search') });
  }

  protected reload(): void {
    document.location.reload();
  }

  protected onKey(ev: KeyboardEvent): void {
    if (ev.key === 'Escape' && this.helpOpen()) {
      this.helpOpen.set(false);
      return;
    }
    if (isTyping(ev)) return;
    if (ev.key === '/') {
      ev.preventDefault();
      const el = document.getElementById('global-search') as HTMLInputElement | null;
      el?.focus();
      el?.select();
    } else if (ev.key === 't') {
      this.theme.toggle();
    } else if (ev.key === '?') {
      this.helpOpen.update((v) => !v);
    }
  }
}
