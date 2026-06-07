import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'pa-rule',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="pa-rule" [class]="'pa-rule--' + variant"></div>`,
  styles: [`
    .pa-rule {
      height: 1px;
      width: 100%;

      &--gold  { background: linear-gradient(90deg, transparent, var(--color-gold), transparent); }
      &--hair  { background: rgba(201,169,97,0.2); }
      &--solid { background: var(--color-gold); }
      &--silver { background: rgba(184,184,184,0.3); }
    }
  `]
})
export class HairlineRuleComponent {
  @Input() variant: 'gold' | 'hair' | 'solid' | 'silver' = 'gold';
}
