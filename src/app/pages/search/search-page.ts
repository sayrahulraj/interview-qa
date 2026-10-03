import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { SearchService } from '../../services/search.service';
import { QuestionList } from '../../shared/question-list';

@Component({
  selector: 'app-search-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [QuestionList],
  template: `
    <h1>Search</h1>
    @if (term()) {
      <p class="muted">Results for “{{ term() }}”</p>
      <app-question-list [questions]="results()" [highlight]="term()" emptyText="No matches. Try fewer or different words." />
    } @else {
      <p class="empty">Type in the search box above. It searches questions, answers, tags, notes and sources.</p>
    }
  `,
})
export class SearchPage {
  readonly q = input<string>();
  private readonly search = inject(SearchService);
  protected readonly term = computed(() => (this.q() ?? '').trim());
  protected readonly results = computed(() => this.search.search(this.term()));
}
