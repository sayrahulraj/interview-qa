import { Injectable, inject, signal } from '@angular/core';
import { StorageService } from './storage.service';

const KEY = 'bookmarks';

@Injectable({ providedIn: 'root' })
export class BookmarkService {
  private readonly storage = inject(StorageService);
  private readonly ids = signal<string[]>(this.storage.get<string[]>(KEY, []));

  readonly bookmarked = this.ids.asReadonly();

  has(id: string): boolean {
    return this.ids().includes(id);
  }

  toggle(id: string): void {
    this.ids.update((list) => {
      const next = list.includes(id) ? list.filter((x) => x !== id) : [id, ...list];
      this.storage.set(KEY, next);
      return next;
    });
  }
}
