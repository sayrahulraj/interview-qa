import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { GROUP_NAMES, isKnownTopic, topicsOf } from '../../config/categories.config';
import { ExternalLink, Question } from '../../models/question.model';
import { DraftService } from '../../services/draft.service';
import { QuestionService } from '../../services/question.service';
import { MarkdownView } from '../../shared/markdown-view';

const LANGUAGES = ['java', 'typescript', 'javascript', 'sql', 'html', 'css', 'json', 'yaml', 'xml', 'bash'];
/** "Java17", "java 17" and "Java-17" all normalise to the same key. */
const tagKey = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, '');
const isHttpUrl = (v: string): boolean => {
  try {
    const u = new URL(v);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};

@Component({
  selector: 'app-admin-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MarkdownView],
  template: `
    @if (notFound()) {
      <div class="state"><p>That question does not exist.</p><a class="btn" routerLink="/admin">Back to list</a></div>
    } @else {
      <h1>{{ id() ? 'Edit question' : 'Add question' }}</h1>
      @if (errors().length) {
        <div class="banner err" role="alert"><strong>Please fix:</strong>
          <ul>@for (e of errors(); track e) { <li>{{ e }}</li> }</ul>
        </div>
      }

      <div class="setup">
        <div class="form-grid">
          <label class="field">Group *
            <select #g (change)="setGroup(g.value)">
              <option value="" [selected]="!group()">Select group…</option>
              @for (n of groups; track n) { <option [value]="n" [selected]="n === group()">{{ n }}</option> }
            </select>
          </label>
          <label class="field">Topic *
            <select #t [disabled]="!group()" (change)="topic.set(t.value)">
              <option value="" [selected]="!topic()">Select topic…</option>
              @for (n of topics(); track n) { <option [value]="n" [selected]="n === topic()">{{ n }}</option> }
            </select>
          </label>
        </div>

        <label class="field">Question *
          <input type="text" [value]="question()" (input)="question.set($any($event.target).value)" />
        </label>

        <div class="split">
          <label class="field">Answer (Markdown) *
            <textarea rows="18" spellcheck="false" [value]="answer()" (input)="onAnswer($any($event.target).value)"></textarea>
          </label>
          <div class="field"><span>Live preview</span>
            <div class="preview panel"><app-markdown [source]="preview()" [codeLanguage]="codeLanguage()" /></div>
          </div>
        </div>

        <div class="field"><span>Tags (type and press Enter)</span>
          <div class="chips">
            @for (t of tags(); track t) {
              <span class="chip">{{ t }} <button type="button" class="chip-x" (click)="removeTag(t)" [attr.aria-label]="'Remove tag ' + t">✕</button></span>
            }
          </div>
          <input type="text" placeholder="e.g. Java 17" [value]="tagInput()" (input)="tagInput.set($any($event.target).value)" (keydown)="onTagKey($event)" />
          @if (tagSuggestions().length) {
            <div class="chips"><span class="muted">Existing:</span>
              @for (s of tagSuggestions(); track s) { <button type="button" class="chip" (click)="addTag(s)">{{ s }}</button> }
            </div>
          }
        </div>

        <div class="form-grid">
          <label class="field">Source / company <input type="text" [value]="source()" (input)="source.set($any($event.target).value)" /></label>
          <label class="field">Code language (for fences without one)
            <input type="text" list="langs" [value]="codeLanguage()" (input)="codeLanguage.set($any($event.target).value)" />
            <datalist id="langs">@for (l of languages; track l) { <option [value]="l"></option> }</datalist>
          </label>
          <label class="field">Diagram path
            <input type="text" placeholder="assets/diagrams/my-diagram.svg" [value]="diagram()" (input)="diagram.set($any($event.target).value)" />
          </label>
        </div>

        <label class="field">Notes
          <textarea rows="3" [value]="notes()" (input)="notes.set($any($event.target).value)"></textarea>
        </label>
        <p class="field-note">Notes, source and links are stored in the public JSON. Do not put private information there.</p>

        <div class="field"><span>Related questions</span>
          <div class="chips">
            @for (r of related(); track r) {
              <span class="chip">{{ label(r) }} <button type="button" class="chip-x" (click)="removeRelated(r)" aria-label="Remove related question">✕</button></span>
            }
          </div>
          <input type="search" placeholder="Search questions to link…" [value]="relatedSearch()" (input)="relatedSearch.set($any($event.target).value)" />
          @if (relatedCandidates().length) {
            <ul class="pick-list">
              @for (c of relatedCandidates(); track c.id) {
                <li><button type="button" (click)="addRelated(c.id)">+ {{ c.question }}</button></li>
              }
            </ul>
          }
        </div>

        <div class="field"><span>External links</span>
          @for (l of links(); track $index) {
            <div class="link-edit">
              <input type="text" placeholder="Label" aria-label="Link label" [value]="l.label" (input)="setLink($index, 'label', $any($event.target).value)" />
              <input type="url" placeholder="https://…" aria-label="Link URL" [value]="l.url" (input)="setLink($index, 'url', $any($event.target).value)" />
              <button type="button" class="btn btn-sm" (click)="removeLink($index)" aria-label="Remove link">Remove</button>
            </div>
          }
          <div><button type="button" class="btn btn-sm" (click)="addLink()">+ Add link</button></div>
        </div>

        <div class="nav-row">
          <button type="button" class="btn btn-primary btn-lg" (click)="save()">Save to draft</button>
          <a class="btn btn-lg" routerLink="/admin">Cancel</a>
        </div>
      </div>
    }
  `,
})
export class AdminForm {
  readonly id = input<string>();

  private readonly qs = inject(QuestionService);
  private readonly draft = inject(DraftService);
  private readonly router = inject(Router);

  protected readonly groups = GROUP_NAMES;
  protected readonly languages = LANGUAGES;

  protected readonly group = signal('');
  protected readonly topic = signal('');
  protected readonly question = signal('');
  protected readonly answer = signal('');
  protected readonly preview = signal('');
  protected readonly tags = signal<string[]>([]);
  protected readonly tagInput = signal('');
  protected readonly notes = signal('');
  protected readonly source = signal('');
  protected readonly related = signal<string[]>([]);
  protected readonly relatedSearch = signal('');
  protected readonly diagram = signal('');
  protected readonly codeLanguage = signal('');
  protected readonly links = signal<ExternalLink[]>([]);
  protected readonly errors = signal<string[]>([]);
  protected readonly notFound = signal(false);

  private existing: Question | undefined;
  private previewTimer: ReturnType<typeof setTimeout> | undefined;

  protected readonly topics = computed(() => topicsOf(this.group()));

  protected readonly tagSuggestions = computed(() => {
    const key = tagKey(this.tagInput());
    if (!key) return [];
    const picked = new Set(this.tags().map(tagKey));
    return this.knownTags()
      .filter((t) => !picked.has(tagKey(t)) && tagKey(t).includes(key))
      .slice(0, 8);
  });

  private readonly knownTags = computed(() => {
    const all = new Set<string>();
    for (const q of this.draft.working()) for (const t of q.tags ?? []) all.add(t);
    return [...all].sort((a, b) => a.localeCompare(b));
  });

  protected readonly relatedCandidates = computed(() => {
    const term = this.relatedSearch().trim().toLowerCase();
    if (!term) return [];
    const taken = new Set([...this.related(), this.existing?.id]);
    return this.draft
      .working()
      .filter((q) => !taken.has(q.id) && (q.question.toLowerCase().includes(term) || q.id.includes(term)))
      .slice(0, 8);
  });

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => this.load(id));
    });
  }

  private load(id: string | undefined): void {
    this.errors.set([]);
    this.notFound.set(false);
    this.existing = id ? this.qs.get(id) : undefined;
    if (id && !this.existing) {
      this.notFound.set(true);
      return;
    }
    const q = this.existing;
    this.group.set(q?.group ?? '');
    this.topic.set(q?.topic ?? '');
    this.question.set(q?.question ?? '');
    this.answer.set(q?.answer ?? '');
    this.preview.set(q?.answer ?? '');
    this.tags.set([...(q?.tags ?? [])]);
    this.notes.set(q?.notes ?? '');
    this.source.set(q?.source ?? '');
    this.related.set([...(q?.relatedIds ?? [])]);
    this.diagram.set(q?.diagram ?? '');
    this.codeLanguage.set(q?.codeLanguage ?? '');
    this.links.set((q?.externalLinks ?? []).map((l) => ({ ...l })));
  }

  protected setGroup(g: string): void {
    this.group.set(g);
    this.topic.set('');
  }

  protected onAnswer(v: string): void {
    this.answer.set(v);
    clearTimeout(this.previewTimer);
    this.previewTimer = setTimeout(() => this.preview.set(v), 300);
  }

  // ---- tags ----
  protected onTagKey(ev: KeyboardEvent): void {
    if (ev.key === 'Enter' || ev.key === ',') {
      ev.preventDefault();
      this.addTag(this.tagInput());
    } else if (ev.key === 'Backspace' && !this.tagInput() && this.tags().length) {
      this.tags.update((t) => t.slice(0, -1));
    }
  }

  protected addTag(raw: string): void {
    const text = raw.replace(/,/g, ' ').trim().replace(/\s+/g, ' ');
    if (!text) return;
    const key = tagKey(text);
    if (!this.tags().some((t) => tagKey(t) === key)) {
      const canonical = this.knownTags().find((t) => tagKey(t) === key) ?? text; // reuse existing spelling
      this.tags.update((t) => [...t, canonical]);
    }
    this.tagInput.set('');
  }

  protected removeTag(t: string): void {
    this.tags.update((list) => list.filter((x) => x !== t));
  }

  // ---- related ----
  protected addRelated(id: string): void {
    this.related.update((r) => (r.includes(id) ? r : [...r, id]));
    this.relatedSearch.set('');
  }
  protected removeRelated(id: string): void {
    this.related.update((r) => r.filter((x) => x !== id));
  }
  protected label(id: string): string {
    return this.draft.working().find((q) => q.id === id)?.question ?? id;
  }

  // ---- links ----
  protected addLink(): void {
    this.links.update((l) => [...l, { label: '', url: '' }]);
  }
  protected removeLink(i: number): void {
    this.links.update((l) => l.filter((_, idx) => idx !== i));
  }
  protected setLink(i: number, field: keyof ExternalLink, value: string): void {
    this.links.update((l) => l.map((x, idx) => (idx === i ? { ...x, [field]: value } : x)));
  }

  // ---- save ----
  private validate(): string[] {
    const e: string[] = [];
    if (!this.group()) e.push('Choose a group.');
    if (!this.topic()) e.push('Choose a topic.');
    else if (!isKnownTopic(this.group(), this.topic())) e.push('That topic does not belong to the selected group.');
    if (!this.question().trim()) e.push('Question is required.');
    if (!this.answer().trim()) e.push('Answer is required.');
    const d = this.diagram().trim();
    if (d && !/\.(svg|png|webp)$/i.test(d)) e.push('Diagram path must end with .svg, .png or .webp.');
    this.links().forEach((l, i) => {
      if (!l.label.trim() && !l.url.trim()) return;
      if (!l.label.trim()) e.push(`Link ${i + 1}: add a label.`);
      if (!isHttpUrl(l.url.trim())) e.push(`Link ${i + 1}: enter a valid http(s) URL.`);
    });
    return e;
  }

  protected save(): void {
    const e = this.validate();
    this.errors.set(e);
    if (e.length) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const now = new Date().toISOString();
    const q: Question = {
      id: this.existing?.id ?? this.draft.newId(this.question()),
      group: this.group(),
      topic: this.topic(),
      question: this.question().trim(),
      answer: this.answer(),
      createdAt: this.existing?.createdAt ?? now,
      updatedAt: now,
    };
    if (this.tags().length) q.tags = this.tags();
    if (this.notes().trim()) q.notes = this.notes().trim();
    if (this.source().trim()) q.source = this.source().trim();
    if (this.related().length) q.relatedIds = this.related();
    if (this.diagram().trim()) q.diagram = this.diagram().trim();
    if (this.codeLanguage().trim()) q.codeLanguage = this.codeLanguage().trim().toLowerCase();
    const links = this.links()
      .filter((l) => l.label.trim() || l.url.trim())
      .map((l) => ({ label: l.label.trim(), url: l.url.trim() }));
    if (links.length) q.externalLinks = links;

    this.draft.upsert(q);
    void this.router.navigate(['/admin']);
  }
}
