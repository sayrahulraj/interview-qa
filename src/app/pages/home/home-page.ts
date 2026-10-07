import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Params, RouterLink } from '@angular/router';
import { QuestionService } from '../../services/question.service';
import { SessionService } from '../../services/session.service';
import { StudyHistoryService } from '../../services/study-history.service';
import { DiagramView } from '../../shared/diagram-view';
import { MarkdownView } from '../../shared/markdown-view';

@Component({
  selector: 'app-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MarkdownView, DiagramView],
  template: `
    <section class="hero">
      <h1>interview-qa</h1>
      <p class="muted">{{ qs.questions().length }} questions across {{ qs.tree().length }} groups. Think first, then reveal.</p>
      <div class="hero-actions">
        <a class="btn btn-primary btn-lg" routerLink="/practice">Practice Random Question</a>
        <a class="btn btn-lg" routerLink="/interview">Interview Mode</a>
        <a class="btn btn-lg" routerLink="/browse">Browse all</a>
      </div>
    </section>

    <section class="widgets">
      <div class="panel">
        <h2>Study streak</h2>
        <div class="stat-cards tight">
          <div class="stat"><span>Reviewed today</span><strong>{{ history.reviewedToday() }}</strong></div>
          <div class="stat ok"><span>Current streak</span><strong>{{ history.currentStreak() }} <small>day{{ history.currentStreak() === 1 ? '' : 's' }}</small></strong></div>
          <div class="stat"><span>Longest streak</span><strong>{{ history.longestStreak() }} <small>day{{ history.longestStreak() === 1 ? '' : 's' }}</small></strong></div>
          <div class="stat"><span>Study sessions</span><strong>{{ history.totalSessions() }}</strong></div>
        </div>
      </div>

      @if (resume(); as r) {
        <div class="panel">
          <h2>Continue studying</h2>
          <a class="resume" [routerLink]="r.link" [queryParams]="r.params">
            <span class="muted">Continue where you left off ({{ r.mode }})</span>
            <strong>→ {{ r.label }}</strong>
          </a>
        </div>
      }

      @if (daily(); as d) {
        <div class="panel wide">
          <h2>Question of the day</h2>
          <div class="meta">{{ d.group }} › {{ d.topic }}</div>
          <p class="q-day">{{ d.question }}</p>
          <button type="button" class="btn btn-sm" [attr.aria-expanded]="showDaily()" (click)="toggleDaily(d.id)">
            {{ showDaily() ? 'Hide answer' : 'Show answer' }}
          </button>
          @if (showDaily()) {
            <div class="daily-answer">
              <app-markdown [source]="d.answer" [codeLanguage]="d.codeLanguage ?? ''" />
              @if (d.diagram; as img) { <app-diagram [src]="img" [alt]="'Diagram for: ' + d.question" /> }
            </div>
          }
        </div>
      }

      <div class="panel wide">
        <div class="prog-head">
          <h2>Recently viewed</h2>
          @if (recent().length) { <button type="button" class="btn btn-sm" (click)="history.clearRecent()">Clear</button> }
        </div>
        @if (recent().length) {
          <ul class="plain-list">
            @for (q of recent(); track q.id) {
              <li><a [routerLink]="['/q', q.id]">{{ q.question }}</a> <span class="muted">· {{ q.topic }}</span></li>
            }
          </ul>
        } @else {
          <p class="muted">Questions you open will show up here.</p>
        }
      </div>
    </section>

    <section class="grid">
      @for (g of qs.tree(); track g.name) {
        <div class="panel">
          <h2>
            <a routerLink="/browse" [queryParams]="{ group: g.name }">{{ g.name }}</a>
            <span class="count">{{ g.count }}</span>
          </h2>
          <div class="chips">
            @for (t of g.topics; track t.name) {
              <a class="chip" routerLink="/browse" [queryParams]="{ group: g.name, topic: t.name }">
                {{ t.name }} <span class="count">{{ t.count }}</span>
              </a>
            }
          </div>
        </div>
      }
    </section>
  `,
})
export class HomePage {
  protected readonly qs = inject(QuestionService);
  protected readonly history = inject(StudyHistoryService);
  private readonly session = inject(SessionService);

  protected readonly daily = computed(() => this.session.dailyQuestion());
  protected readonly showDaily = signal(false);
  private readonly countedDaily = new Set<string>();

  protected readonly recent = computed(() => this.qs.many(this.history.recent()));

  /** Falls back to the topic if the question is gone; hidden if both are gone. */
  protected readonly resume = computed(() => {
    const p = this.history.lastPosition();
    if (!p) return null;
    const q = this.qs.get(p.questionId);
    if (q) return { label: `${q.topic} / ${q.question}`, link: ['/q', q.id], params: {} as Params, mode: p.mode };
    if (this.qs.byGroupTopic(p.group, p.topic).length) {
      return { label: p.topic, link: ['/browse'], params: { group: p.group, topic: p.topic } as Params, mode: p.mode };
    }
    return null;
  });

  protected toggleDaily(id: string): void {
    const open = !this.showDaily();
    this.showDaily.set(open);
    if (open && !this.countedDaily.has(id)) {
      this.countedDaily.add(id);
      this.history.markViewed(id);
      this.history.recordReview(id); // revealing an answer counts as a review
    }
  }
}
