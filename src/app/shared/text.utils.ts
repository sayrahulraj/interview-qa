export const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export const escapeRegex = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Lower-cased, de-duplicated search words (max 8). */
export function searchTerms(term: string | null | undefined): string[] {
  const words = (term ?? '').trim().split(/\s+/).filter((w) => w.length > 0);
  return [...new Set(words.map((w) => w.toLowerCase()))].slice(0, 8);
}

/** Regex with ONE capture group, so String.split puts matches at odd indices. */
export const highlightRegex = (words: string[]): RegExp | null =>
  words.length ? new RegExp(`(${words.map(escapeRegex).join('|')})`, 'gi') : null;

/** Wraps matches in <mark> inside rendered HTML (skips code headers and diagrams). */
export function markText(root: HTMLElement, words: string[]): void {
  const re = highlightRegex(words);
  if (!re) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n as Text);
  for (const node of nodes) {
    if (node.parentElement?.closest('.mermaid-block, .code-head')) continue;
    const parts = node.data.split(re);
    if (parts.length < 2) continue;
    const frag = document.createDocumentFragment();
    parts.forEach((p, i) => {
      if (!p) return;
      if (i % 2) {
        const m = document.createElement('mark');
        m.textContent = p;
        frag.append(m);
      } else {
        frag.append(p);
      }
    });
    node.replaceWith(frag);
  }
}
