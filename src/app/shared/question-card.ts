import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Question, StudyStatus } from '../models/question.model';
import { BookmarkService } from '../services/bookmark.service';
import { QuestionService } from '../services/question.service';
import { StudyHistoryService } from '../services/study-history.service';
import { StudyStatusService } from '../services/study-status.service';
import { DiagramView } from './diagram-view';
import { HighlightPipe } from './highlight.pipe';
import { MarkdownView } from './markdown-view';

@Component({
  selector: 'app-question-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, MarkdownView, DiagramView, HighlightPipe],
  template: `
    <article class="card" [class.open]="open()">
      <header class="card-head">
        <button type="button" class="card-toggle" [attr.aria-expanded]="open()" (click)="toggle()">
          <span class="chev" aria-hidden="true">▸</span>
          <span class="card-title" [innerHTML]="question().question | highlight: highlight()"></span>
        </button>
        @if (state(); as s) {
          <span class="badge" [class.badge-ok]="s === 'learned'" [class.badge-warn]="s === 'revise'">
            {{ s === 'learned' ? 'Learned' : 'Revise' }}
          </span>
        }
        <button type="button" class="icon-btn star" [class.on]="starred()" [attr.aria-pressed]="starred()"
                [attr.aria-label]="starred() ? 'Remove bookmark' : 'Add bookmark'" (click)="bookmarks.toggle(question().id)">
          {{ starred() ? '★' : '☆' }}
        </button>
      </header>

      <div class="card-meta">
        <span>{{ question().group }} › {{ question().topic }}</span>
        @if (question().source; as src) {
          <span class="source">· <span [innerHTML]="src | highlight: highlight()"></span></span>
        }
      </div>
      @if (question().tags?.length) {
        <div class="chips">
          @for (t of question().tags; track t) {
            <a class="chip" routerLink="/browse" [queryParams]="{ tag: t }"
               [innerHTML]="t | highlight: highlight()"></a>
          }
        </div>
      }

      @if (open()) {
        <div class="card-body">
          <app-markdown [source]="question().answer" [codeLanguage]="question().codeLanguage ?? ''" [highlight]="highlight()" />

          @if (question().diagram; as d) {
            <app-diagram [src]="d" [alt]="'Diagram for: ' + question().question" />
          }
          @if (links().length) {
            <div class="link-row">
              @for (l of links(); track l.url) {
                <a class="btn btn-sm" [href]="l.url" target="_blank" rel="noopener noreferrer">{{ l.label }} ↗</a>
              }
            </div>
          }
          @if (question().notes; as n) {
            <aside class="note"><strong>Notes:</strong> <span [innerHTML]="n | highlight: highlight()"></span></aside>
          }
          @if (related().length) {
            <div class="related">
              <strong>Related:</strong>
              @for (r of related(); track r.id) {
                <a [routerLink]="['/q', r.id]">{{ r.question }}</a>
              }
            </div>
          }

          <div class="study-row">
            <button type="button" class="btn btn-sm" [class.btn-ok]="state() === 'learned'" (click)="mark('learned')">✓ Learned</button>
            <button type="button" class="btn btn-sm" [class.btn-warn]="state() === 'revise'" (click)="mark('revise')">↻ Revise Later</button>
            @if (state()) {
              <button type="button" class="btn btn-sm" (click)="clear()">Clear</button>
            }
            <span class="stats">
              @if (stats(); as s) {
                Last studied {{ s.lastStudied | date: 'd MMM y' }} · revised {{ s.timesRevised }}×
              } @else {
                Not studied yet
              }
            </span>
          </div>
        </div>
      }
    </article>
  `,
})
export class QuestionCard {
  readonly question = input.required<Question>();
  readonly highlight = input('');
  readonly expanded = input(false);

  protected readonly bookmarks = inject(BookmarkService);
  private readonly statusSvc = inject(StudyStatusService);
  private readonly history = inject(StudyHistoryService);
  private readonly qs = inject(QuestionService);

  protected readonly open = linkedSignal(() => this.expanded());
  protected readonly state = computed(() => this.statusSvc.get(this.question().id));
  protected readonly starred = computed(() => this.bookmarks.bookmarked().includes(this.question().id));
  protected readonly related = computed(() => this.qs.many(this.question().relatedIds));
  protected readonly stats = computed(() => this.history.questionStats()[this.question().id]);
  protected readonly links = computed(() =>
    (this.question().externalLinks ?? []).filter((l) => /^https?:\/\//i.test(l.url)),
  );

  protected toggle(): void {
    const next = !this.open();
    this.open.set(next);
    if (!next) return;
    const q = this.question();
    this.history.markViewed(q.id);
    this.history.recordReview(q.id); // revealing an answer counts as a review
    this.history.setLastPosition({ group: q.group, topic: q.topic, questionId: q.id, mode: 'browse' });
  }

  protected mark(s: StudyStatus): void {
    const id = this.question().id;
    this.statusSvc.set(id, s);
    if (this.statusSvc.get(id)) this.history.recordReview(id);
  }

  protected clear(): void {
    this.statusSvc.set(this.question().id, null);
  }
}
