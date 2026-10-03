import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Params, Router } from '@angular/router';
import { GROUP_NAMES, topicsOf } from '../../config/categories.config';
import { QuestionService } from '../../services/question.service';
import { QuestionList } from '../../shared/question-list';

@Component({
  selector: 'app-browse-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [QuestionList],
  template: `
    <h1>{{ title() }}</h1>
    <div class="filters">
      <label class="field-inline">Group
        <select #g (change)="setFilter('group', g.value)">
          <option value="" [selected]="!group()">All groups</option>
          @for (n of groups; track n) { <option [value]="n" [selected]="n === group()">{{ n }}</option> }
        </select>
      </label>
      <label class="field-inline">Topic
        <select #t [disabled]="!group()" (change)="setFilter('topic', t.value)">
          <option value="" [selected]="!topic()">All topics</option>
          @for (n of topics(); track n) { <option [value]="n" [selected]="n === topic()">{{ n }}</option> }
        </select>
      </label>
      @if (tag(); as tg) {
        <button type="button" class="chip chip-active" (click)="setFilter('tag', '')" aria-label="Clear tag filter">
          Tag: {{ tg }} ✕
        </button>
      }
    </div>
    <app-question-list [questions]="items()" [initialStatus]="status()" emptyText="No questions match these filters." />
  `,
})
export class BrowsePage {
  readonly group = input<string>();
  readonly topic = input<string>();
  readonly tag = input<string>();
  readonly status = input<string>();

  private readonly qs = inject(QuestionService);
  private readonly router = inject(Router);

  protected readonly groups = GROUP_NAMES;
  protected readonly topics = computed(() => (this.group() ? topicsOf(this.group()!) : []));
  protected readonly items = computed(() => {
    const g = this.group();
    const t = this.topic();
    const tag = this.tag();
    return this.qs
      .questions()
      .filter((q) => (!g || q.group === g) && (!t || q.topic === t) && (!tag || q.tags?.includes(tag)));
  });
  protected readonly title = computed(
    () => this.topic() ?? this.group() ?? (this.tag() ? `Tag: ${this.tag()}` : 'All questions'),
  );

  protected setFilter(key: 'group' | 'topic' | 'tag', value: string): void {
    const queryParams: Params = { [key]: value || null };
    if (key === 'group') queryParams['topic'] = null; // topic depends on group
    void this.router.navigate([], { queryParams, queryParamsHandling: 'merge' });
  }
}
