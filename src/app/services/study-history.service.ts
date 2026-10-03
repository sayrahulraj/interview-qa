import { Injectable, computed, inject, signal } from '@angular/core';
import { LastPosition, QuestionStats } from '../models/question.model';
import { StorageService } from './storage.service';

const MAX_RECENT = 20;
const SESSION_GAP_MS = 30 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

interface StreakState {
  days: Record<string, number>; // local date (YYYY-MM-DD) -> reviews that day
  longest: number;
  sessions: number;
  lastActivity: number; // epoch ms
}

/** Local-time date key, so "a day" matches the user's own calendar day. */
export const dateKey = (d = new Date()): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const shiftDay = (key: string, delta: number): string => {
  const [y, m, d] = key.split('-').map(Number);
  return dateKey(new Date(y, m - 1, d + delta));
};

@Injectable({ providedIn: 'root' })
export class StudyHistoryService {
  private readonly storage = inject(StorageService);

  private readonly recentIds = signal<string[]>(this.storage.get('recent', []));
  private readonly position = signal<LastPosition | null>(this.storage.get('last-position', null));
  private readonly stats = signal<Record<string, QuestionStats>>(this.storage.get('stats', {}));
  private readonly streakState = signal<StreakState>(
    this.storage.get('streak', { days: {}, longest: 0, sessions: 0, lastActivity: 0 }),
  );

  readonly recent = this.recentIds.asReadonly();
  readonly lastPosition = this.position.asReadonly();
  readonly questionStats = this.stats.asReadonly();

  readonly reviewedToday = computed(() => this.streakState().days[dateKey()] ?? 0);

  readonly currentStreak = computed(() => {
    const { days } = this.streakState();
    let cursor = dateKey();
    // The streak stays alive through today even before the first review of the day.
    if (!days[cursor]) cursor = shiftDay(cursor, -1);
    let n = 0;
    while (days[cursor]) {
      n++;
      cursor = shiftDay(cursor, -1);
    }
    return n;
  });

  readonly longestStreak = computed(() => Math.max(this.streakState().longest, this.currentStreak()));
  readonly totalSessions = computed(() => this.streakState().sessions);

  /** Opened question: most recent first, no duplicates. */
  markViewed(id: string): void {
    this.recentIds.update((list) => {
      const next = [id, ...list.filter((x) => x !== id)].slice(0, MAX_RECENT);
      this.storage.set('recent', next);
      return next;
    });
  }

  clearRecent(): void {
    this.recentIds.set([]);
    this.storage.set('recent', []);
  }

  setLastPosition(p: LastPosition): void {
    this.position.set(p);
    this.storage.set('last-position', p);
  }

  clearLastPosition(): void {
    this.position.set(null);
    this.storage.remove('last-position');
  }

  /**
   * Call when an answer is revealed, a status is set, or a question is finished
   * in Practice / Interview mode. Updates stats, streak and session count.
   */
  recordReview(id: string): void {
    const now = Date.now();
    this.stats.update((s) => {
      const prev = s[id];
      const next = {
        ...s,
        [id]: { lastStudied: new Date(now).toISOString(), timesRevised: (prev?.timesRevised ?? 0) + 1 },
      };
      this.storage.set('stats', next);
      return next;
    });

    this.streakState.update((st) => {
      const today = dateKey();
      const days = { ...st.days, [today]: (st.days[today] ?? 0) + 1 };
      const newSession = !st.lastActivity || now - st.lastActivity > SESSION_GAP_MS;
      const probe = { ...st, days };
      const longest = Math.max(st.longest, this.streakFrom(days));
      const next: StreakState = {
        ...probe,
        longest,
        sessions: st.sessions + (newSession ? 1 : 0),
        lastActivity: now,
      };
      this.storage.set('streak', next);
      return next;
    });
  }

  private streakFrom(days: Record<string, number>): number {
    let cursor = dateKey();
    let n = 0;
    while (days[cursor]) {
      n++;
      cursor = shiftDay(cursor, -1);
    }
    return n;
  }

  /** Days since the question was last studied; Infinity if never. */
  daysSinceStudied(id: string): number {
    const s = this.stats()[id];
    return s ? Math.floor((Date.now() - new Date(s.lastStudied).getTime()) / DAY_MS) : Infinity;
  }
}
