import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'pa-blueprint-grid',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="blueprint-grid" [ngStyle]="{'--grid-opacity': opacity}">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .blueprint-grid {
      position: relative;
      isolation: isolate;

      &::before {
        content: '';
        position: absolute;
        inset: 0;
        background-image:
          linear-gradient(rgba(201,169,97, var(--grid-opacity, 0.04)) 1px, transparent 1px),
          linear-gradient(90deg, rgba(201,169,97, var(--grid-opacity, 0.04)) 1px, transparent 1px);
        background-size: 40px 40px;
        pointer-events: none;
        z-index: -1;
      }
    }
  `]
})
export class BlueprintGridComponent {
  @Input() opacity = '0.04';
}
