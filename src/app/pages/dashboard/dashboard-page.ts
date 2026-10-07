import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { QuestionService } from '../../services/question.service';
import { StudyStatusService } from '../../services/study-status.service';
import { ProgressBar } from '../../shared/progress-bar';

@Component({
  selector: 'app-dashboard-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ProgressBar],
  template: `
    <h1>Progress dashboard</h1>

    <div class="stat-cards">
      <a class="stat" routerLink="/browse"><span>Total questions</span><strong>{{ overall().total }}</strong></a>
      <a class="stat ok" routerLink="/browse" [queryParams]="{ status: 'learned' }"><span>Learned</span><strong>{{ overall().learned }}</strong></a>
      <a class="stat warn" routerLink="/browse" [queryParams]="{ status: 'revise' }"><span>Revise Later</span><strong>{{ overall().revise }}</strong></a>
      <a class="stat" routerLink="/browse" [queryParams]="{ status: 'unmarked' }"><span>Not marked</span><strong>{{ overall().unmarked }}</strong></a>
    </div>

    <div class="panel">
      <div class="prog-head"><h2>Overall progress</h2><strong>{{ overall().percent }}%</strong></div>
      <app-progress-bar class="big" [learned]="overall().learned" [revise]="overall().revise" [total]="overall().total" label="Overall progress" />
      <p class="legend"><span class="dot ok"></span> Learned <span class="dot warn"></span> Revise Later <span class="dot rest"></span> Not marked</p>
    </div>

    @for (g of groups(); track g.name) {
      <section class="panel">
        <div class="prog-head">
          <h2><a routerLink="/browse" [queryParams]="{ group: g.name }">{{ g.name }}</a></h2>
          <strong>{{ g.percent }}%</strong>
        </div>
        <app-progress-bar [learned]="g.learned" [revise]="g.revise" [total]="g.total" [label]="g.name + ' progress'" />
        <div class="prog-rows">
          @for (t of g.topics; track t.name) {
            <div class="prog-row">
              <a class="prog-name" routerLink="/browse" [queryParams]="{ group: g.name, topic: t.name }">{{ t.name }}</a>
              <app-progress-bar [learned]="t.learned" [revise]="t.revise" [total]="t.total" [label]="t.name + ' progress'" />
              <span class="prog-pct">{{ t.percent }}%</span>
              <span class="prog-counts">
                <a routerLink="/browse" [queryParams]="{ group: g.name, topic: t.name, status: 'learned' }" title="Learned">✓ {{ t.learned }}</a>
                <a routerLink="/browse" [queryParams]="{ group: g.name, topic: t.name, status: 'revise' }" title="Revise Later">↻ {{ t.revise }}</a>
                <span class="muted">of {{ t.total }}</span>
              </span>
            </div>
          }
        </div>
      </section>
    } @empty {
      <p class="empty">No questions yet.</p>
    }
  `,
})
export class DashboardPage {
  private readonly qs = inject(QuestionService);
  private readonly status = inject(StudyStatusService);

  protected readonly overall = computed(() => this.status.count(this.qs.questions()));

  protected readonly groups = computed(() =>
    this.qs
      .tree()
      .map((g) => ({
        name: g.name,
        ...this.status.count(this.qs.byGroupTopic(g.name)),
        topics: g.topics
          .filter((t) => t.count > 0)
          .map((t) => ({ name: t.name, ...this.status.count(this.qs.byGroupTopic(g.name, t.name)) })),
      }))
      .filter((g) => g.total > 0),
  );
}
