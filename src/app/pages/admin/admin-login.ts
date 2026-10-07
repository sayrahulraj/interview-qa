import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="login panel">
      <h1>Admin login</h1>
      <form class="setup" (submit)="submit($event, u.value, p.value)">
        <label class="field">Username <input #u type="text" autocomplete="username" required /></label>
        <label class="field">Password <input #p type="password" autocomplete="current-password" required /></label>
        @if (error()) { <div class="banner err" role="alert">{{ error() }}</div> }
        <button type="submit" class="btn btn-primary btn-lg">Sign in</button>
      </form>
    </div>
  `,
})
export class AdminLogin {
  readonly returnUrl = input<string>();
  protected readonly error = signal('');
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  constructor() {
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }

  protected submit(ev: Event, user: string, pass: string): void {
    ev.preventDefault();
    const err = this.auth.login(user.trim(), pass);
    this.error.set(err ?? '');
    if (err) return;
    const back = this.returnUrl();
    void this.router.navigateByUrl(back && back.startsWith('/admin') ? back : '/admin');
  }
}
