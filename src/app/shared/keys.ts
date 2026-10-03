/** True when the user is typing in a form control, so shortcuts must be ignored. */
export function isTyping(ev: KeyboardEvent): boolean {
  const t = ev.target as HTMLElement | null;
  if (ev.ctrlKey || ev.metaKey || ev.altKey) return true;
  return !!t && (t.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(t.tagName));
}

/** Stops the browser default (scroll / native button click) for a handled shortcut. */
export function consume(ev: KeyboardEvent): void {
  ev.preventDefault();
  (document.activeElement as HTMLElement | null)?.blur();
}
