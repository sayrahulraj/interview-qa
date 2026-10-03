import { Injectable } from '@angular/core';

const PREFIX = 'interview-qa:';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly memory = new Map<string, string>();
  readonly available: boolean = this.probe();

  private probe(): boolean {
    try {
      const k = `${PREFIX}__probe`;
      localStorage.setItem(k, '1');
      localStorage.removeItem(k);
      return true;
    } catch {
      return false;
    }
  }

  get<T>(key: string, fallback: T): T {
    try {
      const raw = this.available ? localStorage.getItem(PREFIX + key) : this.memory.get(key) ?? null;
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  }

  set<T>(key: string, value: T): void {
    const raw = JSON.stringify(value);
    try {
      if (this.available) localStorage.setItem(PREFIX + key, raw);
      else this.memory.set(key, raw);
    } catch {
      this.memory.set(key, raw); // quota exceeded: keep working in memory
    }
  }

  remove(key: string): void {
    try {
      if (this.available) localStorage.removeItem(PREFIX + key);
    } catch {
      /* ignore */
    }
    this.memory.delete(key);
  }
}
