import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { escapeHtml, highlightRegex, searchTerms } from './text.utils';

/** Escapes the text first, then wraps search matches in <mark>. */
@Pipe({ name: 'highlight' })
export class HighlightPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  transform(text: string | null | undefined, term: string | null | undefined): SafeHtml {
    const value = text ?? '';
    const re = highlightRegex(searchTerms(term));
    const html = re
      ? value.split(re).map((p, i) => (i % 2 ? `<mark>${escapeHtml(p)}</mark>` : escapeHtml(p))).join('')
      : escapeHtml(value);
    return this.sanitizer.bypassSecurityTrustHtml(html); // content is fully escaped above
  }
}
