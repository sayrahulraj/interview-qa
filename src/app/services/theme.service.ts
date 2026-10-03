import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { StorageService } from './storage.service';

export type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storage = inject(StorageService);
  private readonly doc = inject(DOCUMENT);
  private readonly query = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null;

  private readonly systemDark = signal(this.query?.matches ?? false);
  private readonly chosen = signal<ThemeMode | null>(this.storage.get<ThemeMode | null>('theme', null));

  /** Set while printing so diagrams and code render with the light theme. */
  readonly printMode = signal(false);

  readonly isDark = computed(
    () => !this.printMode() && (this.chosen() ?? (this.systemDark() ? 'dark' : 'light')) === 'dark',
  );

  constructor() {
    this.query?.addEventListener('change', (e) => this.systemDark.set(e.matches));
    effect(() => {
      this.doc.documentElement.dataset['theme'] = this.isDark() ? 'dark' : 'light';
    });
  }

  toggle(): void {
    const next: ThemeMode = this.isDark() ? 'light' : 'dark';
    this.chosen.set(next);
    this.storage.set('theme', next);
  }
}
