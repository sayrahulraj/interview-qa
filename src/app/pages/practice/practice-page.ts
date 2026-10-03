import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { Question, StatusFilter, StudyStatus } from '../../models/question.model';
import { QuestionService } from '../../services/question.service';
import { SessionFilters, SessionService } from '../../services/session.service';
import { StudyHistoryService } from '../../services/study-history.service';
import { StudyStatusService } from '../../services/study-status.service';
import { DiagramView } from '../../shared/diagram-view';
import { consume, isTyping } from '../../shared/keys';
import { MarkdownView } from '../../shared/markdown-view';
import { SessionFilterForm } from '../../shared/session-filters';

@Component({
  selector: 'app-practice-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SessionFilterForm, MarkdownView, DiagramView],
  host: { '(document:keydown)': 'onKey($event)' },
  template: `
    @if (!started()) {
      <h1>Practice Random Question</h1>
      <p class="muted">Pick what to practise. You'll see only the question first, so answer it in your head, then reveal.</p>
      <div class="panel setup">
        <app-session-filters [(filters)]="filters" [count]="pool().length" />
        <button type="button" class="btn btn-primary btn-lg" [disabled]="!pool().length" (click)="start()">Start practice</button>
      </div>
    } @else {
      <div class="session-bar">
        <strong>Practice</strong>
        <span class="muted">{{ round() }} done this round</span>
        <button type="button" class="btn btn-sm" (click)="stop()">Change filters</button>
      </div>

      @if (current(); as q) {
        <div class="meta">{{ q.group }} › {{ q.topic }}</div>
        <h1 class="q-big">{{ q.question }}</h1>

        @if (!revealed()) {
          <p class="muted">Think of your answer first, then reveal it.</p>
          <button type="button" class="btn btn-primary btn-lg" (click)="reveal()">Reveal Answer <kbd>Space</kbd></button>
        } @else {
          <div class="panel">
            <app-markdown [source]="q.answer" [codeLanguage]="q.codeLanguage ?? ''" />
            @if (q.diagram; as d) { <app-diagram [src]="d" [alt]="'Diagram for: ' + q.question" /> }
            @if (q.notes; as n) { <aside class="note"><strong>Notes:</strong> {{ n }}</aside> }
          </div>
          <div class="nav-row">
            <button type="button" class="btn" [class.btn-ok]="state() === 'learned'" (click)="mark('learned')">✓ Learned</button>
            <button type="button" class="btn" [class.btn-warn]="state() === 'revise'" (click)="mark('revise')">↻ Revise Later</button>
          </div>
        }

        <div class="nav-row">
          <button type="button" class="btn" [disabled]="!trail().length" (click)="previous()">← Previous <kbd>←</kbd></button>
          <button type="button" class="btn btn-primary" (click)="next()">Next random question <kbd>→</kbd></button>
        </div>
      } @else {
        <div class="state">
          <p>No questions left in this selection. Nice work!</p>
          <button type="button" class="btn btn-primary" (click)="stop()">Change filters</button>
        </div>
      }
    }
  `,
})
export class PracticePage {
  readonly group = input<string>();
  readonly topic = input<string>();
  readonly tag = input<string>();
  readonly status = input<string>();

  private readonly session = inject(SessionService);
  private readonly statusSvc = inject(StudyStatusService);
  private readonly history = inject(StudyHistoryService);
  private readonly qs = inject(QuestionService);

  protected readonly filters = linkedSignal<SessionFilters>(() => ({
    group: this.group() ?? '',
    topic: this.topic() ?? '',
    tag: this.tag() ?? '',
    status: (this.status() === 'learned' || this.status() === 'revise' ? this.status() : 'all') as StatusFilter,
  }));
  protected readonly pool = computed(() => this.session.pool(this.filters()));

  protected readonly started = signal(false);
  protected readonly current = signal<Question | null>(null);
  protected readonly revealed = signal(false);
  protected readonly trail = signal<string[]>([]);
  protected readonly round = signal(0);
  protected readonly state = computed(() => {
    const q = this.current();
    return q ? this.statusSvc.get(q.id) : null;
  });

  protected start(): void {
    if (!this.pool().length) return;
    this.started.set(true);
    this.round.set(0);
    this.trail.set([]);
    this.current.set(null);
    this.pick();
  }

  protected stop(): void {
    this.started.set(false);
    this.current.set(null);
  }

  private pick(): void {
    const prev = this.current()?.id;
    let candidates = this.pool();
    if (candidates.length > 1) candidates = candidates.filter((q) => q.id !== prev);
    const q = this.session.random(candidates) ?? null;
    this.current.set(q);
    this.revealed.set(false);
    if (q) this.remember(q);
  }

  private remember(q: Question): void {
    this.history.setLastPosition({ group: q.group, topic: q.topic, questionId: q.id, mode: 'practice' });
  }

  protected reveal(): void {
    const q = this.current();
    if (!q || this.revealed()) return;
    this.revealed.set(true);
    this.history.markViewed(q.id);
    this.history.recordReview(q.id);
  }

  protected mark(s: StudyStatus): void {
    const q = this.current();
    if (!q) return;
    if (this.statusSvc.get(q.id) !== s) this.statusSvc.set(q.id, s); // explicit set, never a toggle
    this.history.recordReview(q.id);
  }

  protected next(): void {
    const q = this.current();
    if (q) {
      this.trail.update((t) => [...t, q.id]);
      if (this.revealed()) this.round.update((n) => n + 1);
    }
    this.pick();
  }

  protected previous(): void {
    const t = this.trail();
    if (!t.length) return;
    const q = this.qs.get(t[t.length - 1]);
    this.trail.set(t.slice(0, -1));
    if (!q) return;
    this.current.set(q);
    this.revealed.set(false);
    this.remember(q);
  }

  protected onKey(ev: KeyboardEvent): void {
    if (!this.started() || isTyping(ev)) return;
    if (ev.key === ' ' && this.current() && !this.revealed()) { consume(ev); this.reveal(); }
    else if (ev.key === 'ArrowRight' && this.current()) { consume(ev); this.next(); }
    else if (ev.key === 'ArrowLeft') { consume(ev); this.previous(); }
  }
}
