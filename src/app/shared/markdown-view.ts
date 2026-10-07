import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, input, viewChild } from '@angular/core';
import { ThemeService } from '../services/theme.service';
import { MarkdownService } from './markdown.service';
import { markText, searchTerms } from './text.utils';

let mermaidSeq = 0;

@Component({
  selector: 'app-markdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div #host class="md" (click)="onClick($event)"></div>`,
})
export class MarkdownView {
  readonly source = input.required<string>();
  readonly codeLanguage = input('');
  readonly highlight = input('');

  private readonly host = viewChild<ElementRef<HTMLElement>>('host');
  private readonly markdown = inject(MarkdownService);
  private readonly theme = inject(ThemeService);

  constructor() {
    effect(() => {
      const el = this.host()?.nativeElement;
      if (!el) return;
      const html = this.markdown.render(this.source(), this.codeLanguage());
      const dark = this.theme.isDark(); // re-render diagrams on theme change
      const words = searchTerms(this.highlight());
      el.innerHTML = html; // sanitized by DOMPurify in MarkdownService
      markText(el, words);
      void this.renderMermaid(el, dark);
    });
  }

  private async renderMermaid(el: HTMLElement, dark: boolean): Promise<void> {
    const blocks = Array.from(el.querySelectorAll<HTMLElement>('.mermaid-block'));
    if (!blocks.length) return;
    const { default: mermaid } = await import('mermaid');
    mermaid.initialize({
      startOnLoad: false,
      theme: dark ? 'dark' : 'default',
      securityLevel: 'strict',
      suppressErrorRendering: true, // never inject Mermaid's "Syntax error" bomb into the page
    });
    for (const block of blocks) {
      const src = block.querySelector('.mermaid-fallback')?.textContent ?? '';
      if (!src.trim()) continue;
      const id = `mmd-${++mermaidSeq}`;
      try {
        const { svg } = await mermaid.render(id, src);
        if (block.isConnected) block.innerHTML = svg;
      } catch {
        document.getElementById(`d${id}`)?.remove(); // leftover error element, if any
        block.classList.add('mermaid-error'); // keeps the plain-text source visible
      }
    }
  }

  protected async onClick(ev: MouseEvent): Promise<void> {
    const btn = (ev.target as HTMLElement).closest<HTMLButtonElement>('.copy-btn');
    if (!btn) return;
    const code = btn.closest('.code-block')?.querySelector('code')?.textContent ?? '';
    try {
      await navigator.clipboard.writeText(code);
      btn.textContent = 'Copied';
    } catch {
      btn.textContent = 'Copy failed';
    }
    setTimeout(() => (btn.textContent = 'Copy'), 1500);
  }
}
