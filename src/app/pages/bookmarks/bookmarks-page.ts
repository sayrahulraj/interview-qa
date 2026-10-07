import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { BookmarkService } from '../../services/bookmark.service';
import { QuestionService } from '../../services/question.service';
import { QuestionList } from '../../shared/question-list';

@Component({
  selector: 'app-bookmarks-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [QuestionList],
  template: `
    <h1>Bookmarks</h1>
    <app-question-list [questions]="items()" emptyText="No bookmarks yet. Tap the ☆ on any question." />
  `,
})
export class BookmarksPage {
  private readonly qs = inject(QuestionService);
  private readonly bookmarks = inject(BookmarkService);
  protected readonly items = computed(() => this.qs.many(this.bookmarks.bookmarked()));
}
