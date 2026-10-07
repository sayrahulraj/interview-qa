import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { Params, RouterLink } from '@angular/router';
import { Question, StatusFilter, StudyStatus } from '../../models/question.model';
import { SessionFilters, SessionService } from '../../services/session.service';
import { StorageService } from '../../services/storage.service';
import { StudyHistoryService } from '../../services/study-history.service';
import { StudyStatusService } from '../../services/study-status.service';
import { DiagramView } from '../../shared/diagram-view';
import { consume, isTyping } from '../../shared/keys';
import { MarkdownView } from '../../shared/markdown-view';
import { SessionFilterForm } from '../../shared/session-filters';

interface InterviewSettings {
  order: 'sequence' | 'shuffled';
  timerOn: boolean;
  seconds: number;
  custom: boolean; // true = custom duration chosen
  onTimeout: 'reveal' | 'alert';
}

const DEFAULTS: InterviewSettings = { order: 'sequence', timerOn: false, seconds: 120, custom: false, onTimeout: 'alert' };
type Phase = 'setup' | 'running' | 'summary';

@Component({
  selector: 'app-interview-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SessionFilterForm, MarkdownView, DiagramView, RouterLink],
  host: { '(document:keydown)': 'onKey($event)' },
  template: `
    @switch (phase()) {
      @case ('setup') {
        <h1>Interview Mode</h1>
        <p class="muted">Questions one at a time, like a real interview. Optional timer per question.</p>
        <div class="panel setup">
          <app-session-filters [(filters)]="filters" [count]="pool().length" />
          <div class="form-grid">
            <label class="field">Order
              <select #o (change)="patch({ order: $any(o.value) })">
                <option value="sequence" [selected]="settings().order === 'sequence'">In sequence</option>
                <option value="shuffled" [selected]="settings().order === 'shuffled'">Shuffled</option>
              </select>
            </label>
            <label class="field check">
              <input type="checkbox" [checked]="settings().timerOn" (change)="patch({ timerOn: $any($event.target).checked })" />
              Timer per question
            </label>
            @if (settings().timerOn) {
              <label class="field">Time per question
                <select #d (change)="setDuration(d.value)">
                  <option value="60" [selected]="!settings().custom && settings().seconds === 60">1 minute</option>
                  <option value="120" [selected]="!settings().custom && settings().seconds === 120">2 minutes</option>
                  <option value="300" [selected]="!settings().custom && settings().seconds === 300">5 minutes</option>
                  <option value="custom" [selected]="settings().custom">Custom…</option>
                </select>
              </label>
              @if (settings().custom) {
                <label class="field">Custom (minutes)
                  <input type="number" min="1" max="120" [value]="settings().seconds / 60" (change)="setCustom($any($event.target).value)" />
                </label>
              }
              <label class="field">When time ends
                <select #t (change)="patch({ onTimeout: $any(t.value) })">
                  <option value="alert" [selected]="settings().onTimeout === 'alert'">Show “time's up” alert</option>
                  <option value="reveal" [selected]="settings().onTimeout === 'reveal'">Auto-reveal the answer</option>
                </select>
              </label>
            }
          </div>
          <button type="button" class="btn btn-primary btn-lg" [disabled]="!pool().length" (click)="start()">Start interview</button>
        </div>
      }

      @case ('running') {
        @if (current(); as q) {
          <div class="session-bar">
            <strong>Question {{ index() + 1 }} of {{ queue().length }}</strong>
            <div class="progress grow" role="progressbar" aria-valuemin="0" aria-valuemax="100" [attr.aria-valuenow]="progress()">
              <span class="seg seg-primary" [style.width.%]="progress()"></span>
            </div>
            @if (settings().timerOn && !revealed()) {
              <span class="timer" [class.low]="remaining() <= 10" aria-live="off">⏱ {{ clock() }}</span>
            }
            <button type="button" class="btn btn-sm" (click)="finish()">End session</button>
          </div>

          <div class="meta">{{ q.group }} › {{ q.topic }}</div>
          <h1 class="q-big">{{ q.question }}</h1>

          @if (timeUp() && !revealed()) {
            <div class="banner warn" role="alert">⏰ Time's up!</div>
          }

          @if (revealed()) {
            <div class="panel">
              <app-markdown [source]="q.answer" [codeLanguage]="q.codeLanguage ?? ''" />
              @if (q.diagram; as d) { <app-diagram [src]="d" [alt]="'Diagram for: ' + q.question" /> }
              @if (q.notes; as n) { <aside class="note"><strong>Notes:</strong> {{ n }}</aside> }
            </div>
          } @else {
            <button type="button" class="btn btn-primary btn-lg" (click)="reveal()">Reveal Answer <kbd>Space</kbd></button>
          }

          <div class="nav-row">
            <button type="button" class="btn" [disabled]="!revealed()" [class.btn-ok]="result() === 'learned'" (click)="mark('learned')">✓ Learned</button>
            <button type="button" class="btn" [disabled]="!revealed()" [class.btn-warn]="result() === 'revise'" (click)="mark('revise')">↻ Revise Later</button>
          </div>
          <div class="nav-row">
            <button type="button" class="btn" [disabled]="index() === 0" (click)="prev()">← Previous <kbd>←</kbd></button>
            <button type="button" class="btn btn-primary" (click)="next()">
              {{ index() === queue().length - 1 ? 'Finish' : 'Next' }} <kbd>→</kbd>
            </button>
          </div>
        }
      }

      @case ('summary') {
        <h1>Session summary</h1>
        <div class="stat-cards">
          <div class="stat"><span>Questions</span><strong>{{ queue().length }}</strong></div>
          <div class="stat ok"><span>Learned</span><strong>{{ summary().learned }}</strong></div>
          <div class="stat warn"><span>Revise Later</span><strong>{{ summary().revise }}</strong></div>
          <div class="stat"><span>Not marked</span><strong>{{ summary().skipped }}</strong></div>
        </div>

        @if (reviseList().length) {
          <div class="panel">
            <h2>To revise</h2>
            <ul class="plain-list">
              @for (q of reviseList(); track q.id) { <li><a [routerLink]="['/q', q.id]">{{ q.question }}</a></li> }
            </ul>
            <a class="btn btn-primary" routerLink="/browse" [queryParams]="reviewParams()">Review all Revise Later questions</a>
          </div>
        }
        <div class="nav-row">
          <button type="button" class="btn btn-primary" (click)="phase.set('setup')">New session</button>
          <a class="btn" routerLink="/dashboard">Dashboard</a>
        </div>
      }
    }
  `,
})
export class InterviewPage {
  readonly group = input<string>();
  readonly topic = input<string>();
  readonly tag = input<string>();
  readonly status = input<string>();

  private readonly session = inject(SessionService);
  private readonly statusSvc = inject(StudyStatusService);
  private readonly history = inject(StudyHistoryService);
  private readonly storage = inject(StorageService);

  protected readonly filters = linkedSignal<SessionFilters>(() => ({
    group: this.group() ?? '',
    topic: this.topic() ?? '',
    tag: this.tag() ?? '',
    status: (this.status() === 'learned' || this.status() === 'revise' ? this.status() : 'all') as StatusFilter,
  }));
  protected readonly pool = computed(() => this.session.pool(this.filters()));
  protected readonly settings = signal<InterviewSettings>({
    ...DEFAULTS,
    ...this.storage.get<Partial<InterviewSettings>>('interview-settings', {}),
  });

  protected readonly phase = signal<Phase>('setup');
  protected readonly queue = signal<Question[]>([]);
  protected readonly index = signal(0);
  protected readonly revealedIds = signal<ReadonlySet<string>>(new Set());
  protected readonly results = signal<Record<string, StudyStatus>>({});
  protected readonly remaining = signal(0);
  protected readonly timeUp = signal(false);
  private usedFilters: SessionFilters = this.filters();
  private timer: ReturnType<typeof setInterval> | null = null;

  protected readonly current = computed(() => this.queue()[this.index()] ?? null);
  protected readonly revealed = computed(() => {
    const q = this.current();
    return !!q && this.revealedIds().has(q.id);
  });
  protected readonly result = computed(() => {
    const q = this.current();
    return q ? (this.results()[q.id] ?? null) : null;
  });
  protected readonly progress = computed(() => (this.queue().length ? ((this.index() + 1) / this.queue().length) * 100 : 0));
  protected readonly clock = computed(() => {
    const r = Math.max(0, this.remaining());
    return `${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}`;
  });
  protected readonly summary = computed(() => {
    const r = Object.values(this.results());
    const learned = r.filter((s) => s === 'learned').length;
    const revise = r.filter((s) => s === 'revise').length;
    return { learned, revise, skipped: this.queue().length - learned - revise };
  });
  protected readonly reviseList = computed(() => this.queue().filter((q) => this.results()[q.id] === 'revise'));
  protected readonly reviewParams = computed<Params>(() => {
    const f = this.usedFilters;
    const p: Params = { status: 'revise' };
    if (f.group) p['group'] = f.group;
    if (f.topic) p['topic'] = f.topic;
    if (f.tag) p['tag'] = f.tag;
    return p;
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stopTimer());
  }

  protected patch(p: Partial<InterviewSettings>): void {
    this.settings.update((s) => {
      const next = { ...s, ...p };
      this.storage.set('interview-settings', next);
      return next;
    });
  }

  protected setDuration(v: string): void {
    if (v === 'custom') this.patch({ custom: true });
    else this.patch({ custom: false, seconds: +v });
  }

  protected setCustom(minutes: string): void {
    const m = Math.min(120, Math.max(1, Math.round(Number(minutes)) || 1));
    this.patch({ seconds: m * 60, custom: true });
  }

  protected start(): void {
    const pool = this.pool();
    if (!pool.length) return;
    this.usedFilters = this.filters();
    this.queue.set(this.settings().order === 'shuffled' ? this.session.shuffle(pool) : pool);
    this.index.set(0);
    this.revealedIds.set(new Set());
    this.results.set({});
    this.phase.set('running');
    this.enter();
  }

  /** Called whenever a question is shown. */
  private enter(): void {
    const q = this.current();
    if (q) this.history.setLastPosition({ group: q.group, topic: q.topic, questionId: q.id, mode: 'interview' });
    this.startTimer();
  }

  protected reveal(): void {
    const q = this.current();
    if (!q || this.revealed()) return;
    this.stopTimer();
    this.timeUp.set(false);
    this.revealedIds.update((s) => new Set(s).add(q.id));
    this.history.markViewed(q.id);
    this.history.recordReview(q.id);
  }

  protected mark(s: StudyStatus): void {
    const q = this.current();
    if (!q || !this.revealed()) return;
    if (this.statusSvc.get(q.id) !== s) this.statusSvc.set(q.id, s); // explicit set, never a toggle
    this.results.update((r) => ({ ...r, [q.id]: s }));
    this.history.recordReview(q.id);
  }

  protected next(): void {
    if (this.index() >= this.queue().length - 1) {
      this.finish();
      return;
    }
    this.index.update((i) => i + 1);
    this.enter();
  }

  protected prev(): void {
    if (this.index() === 0) return;
    this.index.update((i) => i - 1);
    this.enter();
  }

  protected finish(): void {
    this.stopTimer();
    this.phase.set('summary');
  }

  private startTimer(): void {
    this.stopTimer();
    this.timeUp.set(false);
    const s = this.settings();
    if (!s.timerOn || this.revealed()) return;
    this.remaining.set(s.seconds);
    this.timer = setInterval(() => {
      const r = this.remaining() - 1;
      this.remaining.set(r);
      if (r <= 0) {
        this.stopTimer();
        if (this.settings().onTimeout === 'reveal') this.reveal();
        else this.timeUp.set(true);
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  protected onKey(ev: KeyboardEvent): void {
    if (this.phase() !== 'running' || isTyping(ev)) return;
    if (ev.key === ' ' && !this.revealed()) { consume(ev); this.reveal(); }
    else if (ev.key === 'ArrowRight') { consume(ev); this.next(); }
    else if (ev.key === 'ArrowLeft') { consume(ev); this.prev(); }
  }
}
