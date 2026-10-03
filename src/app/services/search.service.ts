import { Injectable, inject } from '@angular/core';
import { Question } from '../models/question.model';
import { searchTerms } from '../shared/text.utils';
import { QuestionService } from './question.service';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly qs = inject(QuestionService);

  /** All words must match somewhere (AND). Results are ordered by relevance. */
  search(term: string): Question[] {
    const words = searchTerms(term);
    if (!words.length) return [];
    const hits: { q: Question; score: number }[] = [];
    for (const q of this.qs.questions()) {
      let total = 0;
      for (const w of words) {
        const s = this.scoreWord(q, w);
        if (s === 0) {
          total = 0;
          break;
        }
        total += s;
      }
      if (total > 0) hits.push({ q, score: total });
    }
    return hits.sort((a, b) => b.score - a.score).map((h) => h.q);
  }

  private scoreWord(q: Question, w: string): number {
    let s = 0;
    if (q.question.toLowerCase().includes(w)) s += 10;
    if (q.tags?.some((t) => t.toLowerCase().includes(w))) s += 6;
    if (q.notes?.toLowerCase().includes(w)) s += 3;
    if (q.source?.toLowerCase().includes(w)) s += 3;
    if (q.answer.toLowerCase().includes(w)) s += 1;
    return s;
  }
}
