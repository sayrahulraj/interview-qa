import { ChangeDetectionStrategy, Component, inject, input, model } from '@angular/core';
import { GROUP_NAMES, topicsOf } from '../config/categories.config';
import { QuestionService } from '../services/question.service';
import { SessionFilters } from '../services/session.service';

@Component({
  selector: 'app-session-filters',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="form-grid">
      <label class="field">Group
        <select #g (change)="patch({ group: g.value, topic: '' })">
          <option value="" [selected]="!filters().group">All groups</option>
          @for (n of groups; track n) { <option [value]="n" [selected]="n === filters().group">{{ n }}</option> }
        </select>
      </label>
      <label class="field">Topic
        <select #t [disabled]="!filters().group" (change)="patch({ topic: t.value })">
          <option value="" [selected]="!filters().topic">All topics</option>
          @for (n of topics(); track n) { <option [value]="n" [selected]="n === filters().topic">{{ n }}</option> }
        </select>
      </label>
      <label class="field">Status
        <select #s (change)="patch({ status: $any(s.value) })">
          <option value="all" [selected]="filters().status === 'all'">All</option>
          <option value="learned" [selected]="filters().status === 'learned'">Learned</option>
          <option value="revise" [selected]="filters().status === 'revise'">Revise Later</option>
        </select>
      </label>
      <label class="field">Tag (optional)
        <select #tg (change)="patch({ tag: tg.value })">
          <option value="" [selected]="!filters().tag">Any tag</option>
          @for (x of qs.allTags(); track x.tag) { <option [value]="x.tag" [selected]="x.tag === filters().tag">{{ x.tag }} ({{ x.count }})</option> }
        </select>
      </label>
    </div>
    <p class="muted">{{ count() }} matching question{{ count() === 1 ? '' : 's' }}</p>
  `,
})
export class SessionFilterForm {
  readonly filters = model.required<SessionFilters>();
  readonly count = input(0);

  protected readonly qs = inject(QuestionService);
  protected readonly groups = GROUP_NAMES;

  protected topics(): readonly string[] {
    return this.filters().group ? topicsOf(this.filters().group) : [];
  }

  protected patch(p: Partial<SessionFilters>): void {
    this.filters.set({ ...this.filters(), ...p });
  }
}
