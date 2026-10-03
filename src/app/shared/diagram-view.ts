import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

@Component({
  selector: 'app-diagram',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'close()' },
  template: `
    @if (failed()) {
      <div class="diagram-missing">Diagram not available: <code>{{ src() }}</code></div>
    } @else {
      <button type="button" class="diagram-thumb" (click)="open.set(true)" aria-label="Open diagram full size">
        <img [src]="src()" [alt]="alt()" loading="lazy" (error)="failed.set(true)" />
      </button>
    }
    @if (open()) {
      <div class="viewer" role="dialog" aria-modal="true" aria-label="Diagram viewer" (click)="close()">
        <div class="viewer-bar" (click)="$event.stopPropagation()">
          <button type="button" class="btn btn-sm" (click)="zoomBy(-0.25)" aria-label="Zoom out">−</button>
          <span>{{ zoom() * 100 | number: '1.0-0' }}%</span>
          <button type="button" class="btn btn-sm" (click)="zoomBy(0.25)" aria-label="Zoom in">+</button>
          <button type="button" class="btn btn-sm" (click)="zoom.set(1)">Reset</button>
          <button type="button" class="btn btn-sm" (click)="close()">Close ✕</button>
        </div>
        <div class="viewer-body" (click)="$event.stopPropagation()" (wheel)="onWheel($event)">
          <img [src]="src()" [alt]="alt()" [style.width.%]="zoom() * 100" />
        </div>
      </div>
    }
  `,
  imports: [DecimalPipe],
})
export class DiagramView {
  readonly src = input.required<string>();
  readonly alt = input('Diagram');
  protected readonly failed = signal(false);
  protected readonly open = signal(false);
  protected readonly zoom = signal(1);

  protected close(): void {
    if (this.open()) {
      this.open.set(false);
      this.zoom.set(1);
    }
  }

  protected zoomBy(step: number): void {
    this.zoom.update((z) => Math.min(5, Math.max(0.5, +(z + step).toFixed(2))));
  }

  protected onWheel(ev: WheelEvent): void {
    if (!ev.ctrlKey && !ev.metaKey) return;
    ev.preventDefault();
    this.zoomBy(ev.deltaY < 0 ? 0.25 : -0.25);
  }
}
