import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { slug } from '../config/categories.config';
import { Question, QuestionsFile } from '../models/question.model';
import { AuthService } from './auth.service';
import { QuestionService } from './question.service';
import { StorageService } from './storage.service';

/**
 * Admin "working draft". Lives in localStorage. While the admin is logged in the whole app
 * shows the draft; public visitors always see the deployed questions.json.
 */
@Injectable({ providedIn: 'root' })
export class DraftService {
  private readonly storage = inject(StorageService);
  private readonly qs = inject(QuestionService);
  private readonly auth = inject(AuthService);

  private readonly _draft = signal<Question[] | null>(this.storage.get<Question[] | null>('draft', null));
  private readonly _dirty = signal<boolean>(this.storage.get('draft-dirty', false));

  readonly draft = this._draft.asReadonly();
  /** True when there are changes that have not been exported yet. */
  readonly dirty = this._dirty.asReadonly();
  readonly hasDraft = computed(() => this._draft() !== null);
  /** What the admin edits: the draft if there is one, otherwise the deployed data. */
  readonly working = computed(() => this._draft() ?? this.qs.deployedQuestions());

  constructor() {
    effect(() => this.qs.setOverride(this.auth.loggedIn() ? this._draft() : null));
  }

  private commit(list: Question[]): void {
    this._draft.set(list);
    this._dirty.set(true);
    this.storage.set('draft', list);
    this.storage.set('draft-dirty', true);
  }

  upsert(q: Question): void {
    const list = [...this.working()];
    const i = list.findIndex((x) => x.id === q.id);
    if (i >= 0) list[i] = q;
    else list.push(q);
    this.commit(list);
  }

  remove(id: string): void {
    this.commit(
      this.working()
        .filter((q) => q.id !== id)
        .map((q) => {
          if (!q.relatedIds?.includes(id)) return q;
          const relatedIds = q.relatedIds.filter((r) => r !== id);
          const { relatedIds: _drop, ...rest } = q;
          return relatedIds.length ? { ...rest, relatedIds } : rest;
        }),
    );
  }

  replaceAll(list: Question[]): void {
    this.commit(list);
  }

  discard(): void {
    this._draft.set(null);
    this._dirty.set(false);
    this.storage.remove('draft');
    this.storage.remove('draft-dirty');
  }

  newId(text: string): string {
    const base = slug(text).slice(0, 60) || 'question';
    const used = new Set(this.working().map((q) => q.id));
    let id = base;
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    return id;
  }

  /** Downloads the working list as pretty-printed questions.json (same schema as the deployed file). */
  exportFile(): void {
    const file: QuestionsFile = { questions: this.working() };
    const blob = new Blob([JSON.stringify(file, null, 2) + '\n'], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'questions.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    this._dirty.set(false);
    this.storage.set('draft-dirty', false);
  }
}
