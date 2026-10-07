import { Injectable, inject } from '@angular/core';
import { Question, StatusFilter } from '../models/question.model';
import { QuestionService } from './question.service';
import { StudyStatusService } from './study-status.service';
import { dateKey } from './study-history.service';

export interface SessionFilters {
  group: string; // '' = any
  topic: string; // '' = any
  status: StatusFilter; // 'all' | 'learned' | 'revise'
  tag: string; // '' = any
}

export const EMPTY_FILTERS: SessionFilters = { group: '', topic: '', status: 'all', tag: '' };

/** Shared by Practice, Interview Mode and the home page (daily question). */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly qs = inject(QuestionService);
  private readonly status = inject(StudyStatusService);

  pool(f: SessionFilters): Question[] {
    return this.qs
      .questions()
      .filter(
        (q) =>
          (!f.group || q.group === f.group) &&
          (!f.topic || q.topic === f.topic) &&
          (!f.tag || q.tags?.includes(f.tag)) &&
          this.status.matches(q.id, f.status),
      );
  }

  random<T>(list: readonly T[]): T | undefined {
    return list.length ? list[Math.floor(Math.random() * list.length)] : undefined;
  }

  shuffle<T>(list: readonly T[]): T[] {
    const a = [...list];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** Same question all day for the same question set (FNV-1a hash of today's date). */
  dailyQuestion(): Question | undefined {
    const list = [...this.qs.questions()].sort((a, b) => a.id.localeCompare(b.id));
    if (!list.length) return undefined;
    let h = 2166136261;
    for (const ch of dateKey()) {
      h ^= ch.charCodeAt(0);
      h = Math.imul(h, 16777619);
    }
    return list[(h >>> 0) % list.length];
  }
}
