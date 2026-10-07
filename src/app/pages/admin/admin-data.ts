import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Question } from '../../models/question.model';
import { DraftService } from '../../services/draft.service';
import { validateQuestionsFile } from './validate';

@Component({
  selector: 'app-admin-data',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Import / Export</h1>
    <div class="banner">
      Notes, source and links are stored in the public <code>questions.json</code>, so anyone can read them.
      Do not put private information there.
    </div>

    <div class="panel setup">
      <h2>Export</h2>
      <p class="muted">
        Downloads the current draft ({{ draft.working().length }} questions) as <code>questions.json</code>.
        Replace <code>public/data/questions.json</code> in the project and redeploy.
      </p>
      <div><button type="button" class="btn btn-primary" (click)="draft.exportFile()">Download questions.json</button></div>
    </div>

    <div class="panel setup">
      <h2>Import</h2>
      <p class="muted">Upload a questions.json file. It is validated first, and you confirm before it replaces the draft.</p>
      <input #f type="file" accept="application/json,.json" (change)="onFile($any($event.target).files?.[0]); f.value = ''" />

      @if (fileName()) { <p class="muted">File: {{ fileName() }}</p> }
      @if (errors().length) {
        <div class="banner err" role="alert">
          <strong>Import rejected, nothing was changed:</strong>
          <ul>@for (e of errors(); track $index) { <li>{{ e }}</li> }</ul>
        </div>
      }
      @if (pending(); as list) {
        <div class="banner warn" role="status">
          <strong>Valid file with {{ list.length }} questions.</strong>
          Replace the current draft ({{ draft.working().length }} questions) with it?
          <span class="banner-actions">
            <button type="button" class="btn btn-sm btn-primary" (click)="confirm(list)">Replace draft</button>
            <button type="button" class="btn btn-sm" (click)="pending.set(null)">Cancel</button>
          </span>
        </div>
      }
      @if (done()) { <div class="banner ok" role="status">Draft replaced. Remember to export and redeploy.</div> }
    </div>
  `,
})
export class AdminData {
  protected readonly draft = inject(DraftService);
  protected readonly errors = signal<string[]>([]);
  protected readonly pending = signal<Question[] | null>(null);
  protected readonly fileName = signal('');
  protected readonly done = signal(false);

  protected async onFile(file: File | undefined): Promise<void> {
    this.errors.set([]);
    this.pending.set(null);
    this.done.set(false);
    if (!file) return;
    this.fileName.set(file.name);
    if (file.size > 5 * 1024 * 1024) return this.errors.set(['File is larger than 5 MB.']);
    let data: unknown;
    try {
      data = JSON.parse(await file.text());
    } catch (e) {
      return this.errors.set([`Not valid JSON: ${(e as Error).message}`]);
    }
    const result = validateQuestionsFile(data);
    if (result.errors.length) this.errors.set(result.errors);
    else this.pending.set(result.questions);
  }

  protected confirm(list: Question[]): void {
    this.draft.replaceAll(list);
    this.pending.set(null);
    this.done.set(true);
  }
}
