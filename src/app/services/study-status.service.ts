import { Injectable, computed, inject, signal } from '@angular/core';
import { Question, StatusFilter, StudyStatus } from '../models/question.model';
import { StorageService } from './storage.service';

const KEY = 'status';

@Injectable({ providedIn: 'root' })
export class StudyStatusService {
  private readonly storage = inject(StorageService);
  private readonly map = signal<Record<string, StudyStatus>>(this.storage.get(KEY, {}));

  readonly statuses = this.map.asReadonly();

  readonly totals = (questions: readonly Question[]) =>
    computed(() => this.count(questions));

  get(id: string): StudyStatus | null {
    return this.map()[id] ?? null;
  }

  /** Setting the same status again clears it (toggle). */
  set(id: string, status: StudyStatus | null): void {
    this.map.update((m) => {
      const next = { ...m };
      if (status === null || next[id] === status) delete next[id];
      else next[id] = status;
      this.storage.set(KEY, next);
      return next;
    });
  }

  matches(id: string, filter: StatusFilter): boolean {
    const s = this.get(id);
    return filter === 'all' || (filter === 'unmarked' ? s === null : s === filter);
  }

  count(questions: readonly Question[]) {
    const m = this.map();
    let learned = 0;
    let revise = 0;
    for (const q of questions) {
      if (m[q.id] === 'learned') learned++;
      else if (m[q.id] === 'revise') revise++;
    }
    const total = questions.length;
    return {
      total,
      learned,
      revise,
      unmarked: total - learned - revise,
      percent: total ? Math.round((learned / total) * 100) : 0,
    };
  }
}
