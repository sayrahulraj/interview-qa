import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Question } from '../../models/question.model';
import { DraftService } from '../../services/draft.service';
import { searchTerms } from '../../shared/text.utils';

@Component({
  selector: 'app-admin-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe],
  template: `
    <div class="admin-head">
      <h1>Questions <span class="count">{{ rows().length }}</span></h1>
      <a class="btn btn-primary" routerLink="/admin/new">+ Add question</a>
    </div>
    <input type="search" class="wide-input" placeholder="Search question, topic, tag or id…" aria-label="Search questions"
           [value]="term()" (input)="term.set($any($event.target).value)" />

    <div class="table-wrap">
      <table class="table">
        <thead><tr><th>Question</th><th>Group › Topic</th><th>Updated</th><th></th></tr></thead>
        <tbody>
          @for (q of rows(); track q.id) {
            <tr>
              <td>{{ q.question }}</td>
              <td class="nowrap">{{ q.group }} › {{ q.topic }}</td>
              <td class="nowrap">{{ q.updatedAt | date: 'd MMM y' }}</td>
              <td class="nowrap">
                <a class="btn btn-sm" [routerLink]="['/admin/edit', q.id]">Edit</a>
                <button type="button" class="btn btn-sm btn-danger-outline" (click)="pending.set(q)">Delete</button>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="4" class="empty">No questions match.</td></tr>
          }
        </tbody>
      </table>
    </div>

    @if (pending(); as q) {
      <div class="modal-backdrop" (click)="pending.set(null)">
        <div class="modal" role="alertdialog" aria-modal="true" aria-labelledby="del-title" (click)="$event.stopPropagation()">
          <h2 id="del-title">Delete question?</h2>
          <p>“{{ q.question }}” will be removed from the draft. Links to it from other questions are removed too.</p>
          <div class="nav-row">
            <button type="button" class="btn btn-danger" (click)="confirmDelete(q.id)">Delete</button>
            <button type="button" class="btn" (click)="pending.set(null)">Cancel</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class AdminList {
  private readonly draft = inject(DraftService);
  protected readonly term = signal('');
  protected readonly pending = signal<Question | null>(null);

  protected readonly rows = computed(() => {
    const words = searchTerms(this.term());
    return this.draft.working().filter((q) => {
      if (!words.length) return true;
      const hay = [q.id, q.question, q.group, q.topic, ...(q.tags ?? [])].join(' ').toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  });

  protected confirmDelete(id: string): void {
    this.draft.remove(id);
    this.pending.set(null);
  }
}
