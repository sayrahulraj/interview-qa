import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DraftService } from '../../services/draft.service';

@Component({
  selector: 'app-admin-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="admin-bar">
      <strong>Admin</strong>
      <nav class="admin-nav" aria-label="Admin">
        <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Questions</a>
        <a routerLink="/admin/new" routerLinkActive="active">Add</a>
        <a routerLink="/admin/data" routerLinkActive="active">Import / Export</a>
      </nav>
      <span class="grow"></span>
      <a routerLink="/">View site</a>
      <button type="button" class="btn btn-sm" (click)="logout()">Log out</button>
    </div>

    @if (auth.usingDefaultPassword) {
      <div class="banner err">The default admin password is still in use. Change it in <code>src/environments/admin.config.ts</code>.</div>
    }
    @if (draft.dirty()) {
      <div class="banner warn" role="status">
        <strong>You have unsaved changes.</strong> Export JSON and redeploy.
        <span class="banner-actions">
          <button type="button" class="btn btn-sm btn-primary" (click)="draft.exportFile()">Export JSON</button>
          <button type="button" class="btn btn-sm" (click)="confirmDiscard.set(true)">Discard draft and reset to deployed data</button>
        </span>
      </div>
    } @else if (draft.hasDraft()) {
      <div class="banner" role="status">
        A local draft is active. After you redeploy, discard it to see the deployed data again.
        <span class="banner-actions"><button type="button" class="btn btn-sm" (click)="confirmDiscard.set(true)">Discard draft and reset to deployed data</button></span>
      </div>
    }

    <router-outlet />

    @if (confirmDiscard()) {
      <div class="modal-backdrop" (click)="confirmDiscard.set(false)">
        <div class="modal" role="alertdialog" aria-modal="true" aria-labelledby="dd-title" (click)="$event.stopPropagation()">
          <h2 id="dd-title">Discard draft?</h2>
          <p>All local admin changes will be lost and the deployed questions will be shown again.</p>
          <div class="nav-row">
            <button type="button" class="btn btn-danger" (click)="discard()">Discard draft</button>
            <button type="button" class="btn" (click)="confirmDiscard.set(false)">Cancel</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class AdminShell {
  protected readonly auth = inject(AuthService);
  protected readonly draft = inject(DraftService);
  private readonly router = inject(Router);
  protected readonly confirmDiscard = signal(false);

  protected logout(): void {
    this.auth.logout();
    void this.router.navigate(['/admin/login']);
  }

  protected discard(): void {
    this.draft.discard();
    this.confirmDiscard.set(false);
  }
}
