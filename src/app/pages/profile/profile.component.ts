import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { BtnComponent } from '../../shared/components/btn/btn.component';
import { SeoService } from '../../core/services/seo.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'pa-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, BtnComponent],
  template: `
    <section class="profile section section--dark">
      <div class="container">
        <div class="profile__panel">
          <span class="eyebrow">Profile</span>
          <h1>Account details.</h1>

          @if (message()) {
            <p class="profile__notice">{{message()}}</p>
          }
          @if (error()) {
            <p class="profile__error">{{error()}}</p>
          }

          <form class="profile__form" [formGroup]="form" (ngSubmit)="save()">
            <label>
              <span>Name</span>
              <input type="text" formControlName="name" autocomplete="name" />
            </label>
            <label>
              <span>Email</span>
              <input type="email" formControlName="email" autocomplete="email" readonly />
            </label>
            <div class="profile__actions">
              <pa-btn variant="primary" type="submit" [disabled]="form.invalid || saving()">Save Changes</pa-btn>
              <pa-btn variant="outline" routerLink="/dashboard">Back to Dashboard</pa-btn>
            </div>
          </form>
        </div>
      </div>
    </section>
  `,
  styles: [`
    @use '../../../styles/tokens' as *;
    .profile { padding-block: var(--space-16) var(--space-20); }
    .profile__panel { max-width: 36rem; margin-inline: auto; padding: var(--space-8); background: var(--color-surface-1); border: 1px solid rgba(201,169,97,0.2); border-radius: var(--border-radius-md); box-shadow: var(--shadow-card); h1 { margin-bottom: var(--space-6); } }
    .profile__form { display: grid; gap: var(--space-4); label { display: grid; gap: var(--space-2); } span { color: var(--color-gold); font-size: var(--text-xs); font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; } input { width: 100%; padding: 0.75rem 1rem; color: var(--color-ivory); background: var(--color-navy); border: 1px solid rgba(201,169,97,0.24); border-radius: var(--border-radius); font-size: var(--text-sm); &:focus { outline: none; border-color: var(--color-gold); } &[readonly] { color: var(--color-silver); } } }
    .profile__actions { display: flex; gap: var(--space-3); flex-wrap: wrap; margin-top: var(--space-3); }
    .profile__notice, .profile__error { max-width: none; padding: var(--space-3); border-radius: var(--border-radius); font-size: var(--text-sm); margin-bottom: var(--space-4); }
    .profile__notice { background: rgba(201,169,97,0.12); border: 1px solid rgba(201,169,97,0.24); }
    .profile__error { color: #ffd7d7; background: rgba(160,40,40,0.22); border: 1px solid rgba(255,120,120,0.24); }
  `]
})
export class ProfileComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private seo = inject(SeoService);
  private userSub?: Subscription;

  readonly saving = signal(false);
  readonly message = signal('');
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: [{ value: '', disabled: false }, [Validators.required, Validators.email]],
  });

  ngOnInit(): void {
    this.seo.update({ title: 'Profile', description: 'Manage reader profile for The Patent Architect.' });
    this.userSub = this.auth.user$.subscribe(user => {
      if (user) {
        this.form.patchValue({ name: user.name, email: user.email }, { emitEvent: false });
      }
    });
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.message.set('');
    try {
      await this.auth.updateDisplayName(this.form.getRawValue().name);
      this.message.set('Profile updated.');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Could not update profile.');
    } finally {
      this.saving.set(false);
    }
  }
}
