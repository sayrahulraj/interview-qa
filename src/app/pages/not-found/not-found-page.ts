import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `<div class="state"><h1>Page not found</h1><a class="btn btn-primary" routerLink="/">Go home</a></div>`,
})
export class NotFoundPage {}
