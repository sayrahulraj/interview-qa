import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { Question, StatusFilter } from '../models/question.model';
import { StudyHistoryService } from '../services/study-history.service';
import { ThemeService } from '../services/theme.service';
import { StudyStatusService } from '../services/study-status.service';
import { QuestionCard } from './question-card';

type SortKey = 'default' | 'stale' | 'newest';
const PAGE = 30;
const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'learned', label: 'Learned' },
  { key: 'revise', label: 'Revise Later' },
  { key: 'unmarked', label: 'Not marked' },
];
const toFilter = (s: string | undefined): StatusFilter =>
  FILTERS.some((f) => f.key === s) ? (s as StatusFilter) : 'all';

@Component({
  selector: 'app-question-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [QuestionCard],
  template: `
    <div class="toolbar">
      <div class="seg" role="group" aria-label="Filter by status">
        @for (f of filters; track f.key) {
          <button type="button" class="seg-btn" [class.active]="status() === f.key" (click)="status.set(f.key)">
            {{ f.label }} <span class="count">{{ countFor(f.key) }}</span>
          </button>
        }
      </div>
      <label class="field-inline">Sort
        <select #so [value]="sort()" (change)="sort.set($any(so.value))">
          <option value="default">Default</option>
          <option value="stale">Not studied longest</option>
          <option value="newest">Recently updated</option>
        </select>
      </label>
      <label class="field-inline">Not studied for
        <select #sd [value]="staleDays()" (change)="staleDays.set(+sd.value)">
          <option value="0">Any time</option>
          <option value="7">7+ days</option>
          <option value="30">30+ days</option>
          <option value="90">90+ days</option>
        </select>
      </label>
      <button type="button" class="btn btn-sm" (click)="allOpen.set(!allOpen())">
        {{ allOpen() ? 'Collapse all' : 'Expand all' }}
      </button>
      <button type="button" class="btn btn-sm" (click)="print()">🖨 Print</button>
    </div>

    <p class="muted">{{ filtered().length }} of {{ questions().length }} questions</p>

    <div class="stack">
      @for (q of visible(); track q.id) {
        <app-question-card [question]="q" [highlight]="highlight()" [expanded]="allOpen()" />
      } @empty {
        <p class="empty">{{ emptyText() }}</p>
      }
    </div>

    @if (filtered().length > visible().length) {
      <div class="center"><button type="button" class="btn" (click)="limit.set(limit() + PAGE)">Show more</button></div>
    }
  `,
})
export class QuestionList {
  readonly questions = input.required<Question[]>();
  readonly highlight = input('');
  readonly initialStatus = input<string | undefined>();
  readonly emptyText = input('No questions found.');

  private readonly statusSvc = inject(StudyStatusService);
  private readonly history = inject(StudyHistoryService);
  private readonly theme = inject(ThemeService);

  protected readonly filters = FILTERS;
  protected readonly PAGE = PAGE;
  protected readonly status = linkedSignal<StatusFilter>(() => toFilter(this.initialStatus()));
  protected readonly sort = signal<SortKey>('default');
  protected readonly staleDays = signal(0);
  protected readonly allOpen = signal(false);

  private readonly counts = computed(() => this.statusSvc.count(this.questions()));

  protected readonly filtered = computed(() => {
    const filter = this.status();
    const days = this.staleDays();
    const sort = this.sort();
    let list = this.questions().filter((q) => this.statusSvc.matches(q.id, filter));
    if (days > 0) list = list.filter((q) => this.history.daysSinceStudied(q.id) >= days);
    if (sort === 'stale') {
      const stats = this.history.questionStats();
      const t = (id: string) => (stats[id] ? Date.parse(stats[id].lastStudied) : 0); // never studied first
      list = [...list].sort((a, b) => t(a.id) - t(b.id));
    } else if (sort === 'newest') {
      list = [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }
    return list;
  });

  protected readonly limit = linkedSignal(() => {
    this.filtered();
    return PAGE;
  });
  protected readonly visible = computed(() => this.filtered().slice(0, this.limit()));

  /** Expands every answer, switches to the light theme and opens the print dialog. */
  protected print(): void {
    this.allOpen.set(true);
    this.limit.set(this.filtered().length);
    this.theme.printMode.set(true);
    const restore = () => {
      this.theme.printMode.set(false);
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);
    setTimeout(() => window.print(), 800); // give Mermaid time to re-render in the light theme
  }

  protected countFor(k: StatusFilter): number {
    const c = this.counts();
    return k === 'all' ? c.total : k === 'learned' ? c.learned : k === 'revise' ? c.revise : c.unmarked;
  }
}
