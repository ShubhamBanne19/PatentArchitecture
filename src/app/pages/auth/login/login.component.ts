import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BtnComponent } from '../../../shared/components/btn/btn.component';
import { SeoService } from '../../../core/services/seo.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'pa-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, BtnComponent],
  template: `
    <section class="auth section section--dark">
      <div class="container">
        <div class="auth__panel">
          <span class="eyebrow">Reader Login</span>
          <h1>Welcome back.</h1>
          <p>Sign in to manage your subscription and premium companion resources.</p>

          @if (error()) {
            <p class="auth__alert">{{error()}}</p>
          }
          @if (resetSent()) {
            <p class="auth__notice">Password reset email sent. Check your inbox.</p>
          }

          <form class="auth__form" [formGroup]="form" (ngSubmit)="submit()">
            <label>
              <span>Email</span>
              <input type="email" formControlName="email" autocomplete="email" />
            </label>
            <label>
              <span>Password</span>
              <input type="password" formControlName="password" autocomplete="current-password" />
            </label>
            <pa-btn variant="primary" type="submit" [fullWidth]="true" [disabled]="form.invalid || submitting()">
              {{submitting() ? 'Signing in...' : 'Sign In'}}
            </pa-btn>
          </form>

          <div class="auth__alt">
            <button type="button" (click)="forgotPassword()">Forgot password?</button>
            <button type="button" (click)="googleLogin()" [disabled]="submitting()">Continue with Google</button>
          </div>

          <p class="auth__switch">
            New reader? <a routerLink="/register" [queryParams]="registerQueryParams">Create an account</a>
          </p>
        </div>
      </div>
    </section>
  `,
  styles: [`
    @use '../../../../styles/tokens' as *;
    @use '../../../../styles/mixins' as *;

    .auth { padding-block: var(--space-16) var(--space-20); }
    .auth__panel {
      max-width: 32rem;
      margin-inline: auto;
      padding: var(--space-8);
      background: var(--color-surface-1);
      border: 1px solid rgba(201,169,97,0.2);
      border-radius: var(--border-radius-md);
      box-shadow: var(--shadow-card);

      h1 { margin-bottom: var(--space-3); }
      > p { color: rgba(244,239,230,0.72); margin-bottom: var(--space-6); }
    }

    .auth__form {
      display: grid;
      gap: var(--space-4);

      label {
        display: grid;
        gap: var(--space-2);
      }

      span {
        color: var(--color-gold);
        font-size: var(--text-xs);
        font-weight: 600;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      input {
        width: 100%;
        padding: 0.75rem 1rem;
        color: var(--color-ivory);
        background: var(--color-navy);
        border: 1px solid rgba(201,169,97,0.24);
        border-radius: var(--border-radius);
        font-size: var(--text-sm);

        &:focus { outline: none; border-color: var(--color-gold); }
      }
    }

    .auth__alert,
    .auth__notice {
      max-width: none;
      padding: var(--space-3);
      border-radius: var(--border-radius);
      font-size: var(--text-sm);
    }

    .auth__alert {
      color: #ffd7d7;
      background: rgba(160, 40, 40, 0.22);
      border: 1px solid rgba(255, 120, 120, 0.24);
    }

    .auth__notice {
      color: var(--color-ivory);
      background: rgba(201,169,97,0.12);
      border: 1px solid rgba(201,169,97,0.25);
    }

    .auth__alt {
      display: grid;
      gap: var(--space-3);
      margin-top: var(--space-5);

      button {
        color: var(--color-gold);
        font-size: var(--text-sm);
        text-align: center;
      }
    }

    .auth__switch {
      margin-top: var(--space-6);
      color: rgba(244,239,230,0.72);
      text-align: center;
      max-width: none;
    }
  `]
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private seo = inject(SeoService);

  readonly submitting = signal(false);
  readonly error = signal('');
  readonly resetSent = signal(false);
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  get registerQueryParams(): Record<string, string> {
    const params = this.route.snapshot.queryParamMap;
    return {
      ...(params.get('plan') ? { plan: params.get('plan')! } : {}),
      ...(params.get('returnUrl') ? { returnUrl: params.get('returnUrl')! } : {}),
    };
  }

  ngOnInit(): void {
    this.seo.update({ title: 'Login', description: 'Login to The Patent Architect premium companion.' });
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    this.error.set('');
    this.submitting.set(true);
    try {
      const value = this.form.getRawValue();
      await this.auth.signInWithEmail(value.email, value.password);
      await this.navigateAfterAuth();
    } catch (error) {
      this.error.set(this.errorMessage(error));
    } finally {
      this.submitting.set(false);
    }
  }

  async googleLogin(): Promise<void> {
    this.error.set('');
    this.submitting.set(true);
    try {
      await this.auth.signInWithGoogle();
      await this.navigateAfterAuth();
    } catch (error) {
      this.error.set(this.errorMessage(error));
    } finally {
      this.submitting.set(false);
    }
  }

  async forgotPassword(): Promise<void> {
    const email = this.form.controls.email.value;
    if (!email || this.form.controls.email.invalid) {
      this.error.set('Enter your email address first.');
      return;
    }

    this.error.set('');
    await this.auth.resetPassword(email);
    this.resetSent.set(true);
  }

  private navigateAfterAuth(): Promise<boolean> {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    const plan = this.route.snapshot.queryParamMap.get('plan');

    if (returnUrl) {
      return this.router.navigateByUrl(returnUrl);
    }
    if (plan) {
      return this.router.navigate(['/subscription'], { queryParams: { plan } });
    }
    return this.router.navigate(['/dashboard']);
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Could not sign in. Please try again.';
  }
}
