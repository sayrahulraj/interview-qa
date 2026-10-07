import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { QuestionService } from '../../services/question.service';
import { StudyHistoryService } from '../../services/study-history.service';
import { QuestionCard } from '../../shared/question-card';

@Component({
  selector: 'app-question-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [QuestionCard, RouterLink],
  template: `
    @if (question(); as q) {
      <a class="back" routerLink="/browse" [queryParams]="{ group: q.group, topic: q.topic }">← {{ q.topic }}</a>
      <app-question-card [question]="q" [expanded]="true" />
    } @else {
      <div class="state"><p>That question no longer exists.</p><a class="btn" routerLink="/browse">Browse questions</a></div>
    }
  `,
})
export class QuestionPage {
  readonly id = input.required<string>();
  private readonly qs = inject(QuestionService);
  private readonly history = inject(StudyHistoryService);
  protected readonly question = computed(() => this.qs.get(this.id()));

  constructor() {
    effect(() => {
      const q = this.question();
      if (!q) return;
      this.history.markViewed(q.id);
      this.history.setLastPosition({ group: q.group, topic: q.topic, questionId: q.id, mode: 'browse' });
    });
  }
}
