import { Injectable } from '@angular/core';
import { Marked, type Tokens } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import css from 'highlight.js/lib/languages/css';
import java from 'highlight.js/lib/languages/java';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml'; // also handles html
import yaml from 'highlight.js/lib/languages/yaml';
import { escapeHtml } from './text.utils';

hljs.registerLanguage('bash', bash);
hljs.registerLanguage('css', css);
hljs.registerLanguage('java', java);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('yaml', yaml);

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node.hasAttribute('href')) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

@Injectable({ providedIn: 'root' })
export class MarkdownService {
  private defaultLang = '';

  private readonly marked = new Marked({
    gfm: true,
    renderer: { code: (token: Tokens.Code) => this.renderCode(token.text, token.lang) },
  });

  /** Markdown -> sanitized HTML. `defaultLang` applies to fences without a language. */
  render(markdown: string, defaultLang = ''): string {
    this.defaultLang = defaultLang.trim().toLowerCase();
    const raw = this.marked.parse(markdown ?? '', { async: false }) as string;
    return DOMPurify.sanitize(raw);
  }

  private renderCode(text: string, info?: string): string {
    const lang = (info ?? '').trim().split(/\s+/)[0].toLowerCase() || this.defaultLang;
    if (lang === 'mermaid') {
      // The source stays in the fallback <pre> text: DOMPurify strips attribute values containing "-->".
      return `<div class="mermaid-block"><pre class="mermaid-fallback">${escapeHtml(text)}</pre></div>`;
    }
    const known = lang && hljs.getLanguage(lang) ? lang : null;
    const body = known ? hljs.highlight(text, { language: known, ignoreIllegals: true }).value : escapeHtml(text);
    const label = known ?? (lang || 'text');
    return (
      `<div class="code-block"><div class="code-head"><span class="code-lang">${escapeHtml(label)}</span>` +
      `<button type="button" class="copy-btn">Copy</button></div>` +
      `<pre><code class="hljs">${body}</code></pre></div>`
    );
  }
}
