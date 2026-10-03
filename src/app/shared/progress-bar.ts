import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Stacked progress bar: green = Learned, amber = Revise Later, rest = Not marked. */
@Component({
  selector: 'app-progress-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100"
         [attr.aria-valuenow]="percent()" [attr.aria-label]="label()">
      <span class="seg seg-ok" [style.width.%]="share(learned())"></span>
      <span class="seg seg-warn" [style.width.%]="share(revise())"></span>
    </div>
  `,
})
export class ProgressBar {
  readonly learned = input(0);
  readonly revise = input(0);
  readonly total = input(0);
  readonly label = input('Progress');

  protected readonly percent = computed(() => (this.total() ? Math.round((this.learned() / this.total()) * 100) : 0));
  protected share(n: number): number {
    return this.total() ? (n / this.total()) * 100 : 0;
  }
}
