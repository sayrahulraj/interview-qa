import { Injectable, signal } from '@angular/core';
import { ADMIN_CONFIG, DEFAULT_ADMIN_PASSWORD } from '../../environments/admin.config';

const SESSION_KEY = 'interview-qa:admin-session';

/** Front-end-only auth (see admin.config.ts). The session lives in sessionStorage. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly usingDefaultPassword = ADMIN_CONFIG.password === DEFAULT_ADMIN_PASSWORD;
  readonly loggedIn = signal(this.read());

  private failures = 0;
  private lockedUntil = 0;

  private read(): boolean {
    try {
      return sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
      return false;
    }
  }

  /** Returns null on success, otherwise a message for the user. */
  login(username: string, password: string): string | null {
    const now = Date.now();
    if (now < this.lockedUntil) return `Too many attempts. Try again in ${Math.ceil((this.lockedUntil - now) / 1000)}s.`;
    const ok = this.same(username, ADMIN_CONFIG.username) && this.same(password, ADMIN_CONFIG.password);
    if (!ok) {
      this.failures++;
      if (this.failures >= 5) {
        this.lockedUntil = now + 30_000;
        this.failures = 0;
      }
      return 'Invalid username or password.';
    }
    this.failures = 0;
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      /* session still works in memory for this tab */
    }
    this.loggedIn.set(true);
    return null;
  }

  logout(): void {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
    this.loggedIn.set(false);
  }

  private same(a: string, b: string): boolean {
    let diff = a.length ^ b.length;
    for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
    return diff === 0;
  }
}
