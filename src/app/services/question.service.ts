import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Question, QuestionsFile } from '../models/question.model';
import { CATEGORIES, slug } from '../config/categories.config';

export type LoadState = 'idle' | 'loading' | 'ready' | 'error';

@Injectable({ providedIn: 'root' })
export class QuestionService {
  private readonly http = inject(HttpClient);

  private readonly deployed = signal<Question[]>([]);
  /** Set by DraftService (Part 4) while the admin is logged in; null for public visitors. */
  private readonly override = signal<Question[] | null>(null);

  readonly state = signal<LoadState>('idle');
  readonly error = signal<string | null>(null);

  readonly deployedQuestions = this.deployed.asReadonly();
  readonly questions = computed(() => this.override() ?? this.deployed());

  private readonly byId = computed(() => new Map(this.questions().map((q) => [q.id, q])));

  readonly allTags = computed(() => {
    const counts = new Map<string, number>();
    for (const q of this.questions()) for (const t of q.tags ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
    return [...counts].map(([tag, count]) => ({ tag, count })).sort((a, b) => a.tag.localeCompare(b.tag));
  });

  /** Counts per group and topic, in the fixed CATEGORIES order. */
  readonly tree = computed(() =>
    CATEGORIES.map((g) => ({
      name: g.name,
      slug: slug(g.name),
      count: this.questions().filter((q) => q.group === g.name).length,
      topics: g.topics.map((t) => ({
        name: t,
        slug: slug(t),
        count: this.questions().filter((q) => q.group === g.name && q.topic === t).length,
      })),
    })),
  );

  load(force = false): void {
    if (!force && (this.state() === 'loading' || this.state() === 'ready')) return;
    this.state.set('loading');
    this.error.set(null);
    this.http.get<QuestionsFile>('data/questions.json').subscribe({
      next: (file) => {
        if (!file || !Array.isArray(file.questions)) {
          this.fail('questions.json has an invalid format.');
          return;
        }
        this.deployed.set(file.questions);
        this.state.set('ready');
      },
      error: () => this.fail('Could not load questions. Check your connection and retry.'),
    });
  }

  private fail(msg: string): void {
    this.error.set(msg);
    this.state.set('error');
  }

  setOverride(list: Question[] | null): void {
    this.override.set(list);
  }

  get(id: string): Question | undefined {
    return this.byId().get(id);
  }

  many(ids: readonly string[] | undefined): Question[] {
    return (ids ?? []).map((id) => this.byId().get(id)).filter((q): q is Question => !!q);
  }

  byGroupTopic(group?: string, topic?: string): Question[] {
    return this.questions().filter((q) => (!group || q.group === group) && (!topic || q.topic === topic));
  }

  fromSlugs(groupSlug: string, topicSlug?: string): { group?: string; topic?: string } {
    const g = CATEGORIES.find((c) => slug(c.name) === groupSlug);
    const t = g?.topics.find((x) => slug(x) === topicSlug);
    return { group: g?.name, topic: t };
  }
}
