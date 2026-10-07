import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { QuestionService } from '../../services/question.service';

@Component({
  selector: 'app-tags-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <h1>Tags</h1>
    <div class="chips chips-lg">
      @for (t of qs.allTags(); track t.tag) {
        <a class="chip" routerLink="/browse" [queryParams]="{ tag: t.tag }">{{ t.tag }} <span class="count">{{ t.count }}</span></a>
      } @empty {
        <p class="empty">No tags yet.</p>
      }
    </div>
  `,
})
export class TagsPage {
  protected readonly qs = inject(QuestionService);
}
