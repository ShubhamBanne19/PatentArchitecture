import { TestBed } from '@angular/core/testing';
import { Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { authGuard, guestGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

class MockAuthService {
  loading = signal(true);
  isAuthenticated = signal(false);
  private readySubject = new BehaviorSubject(false);
  ready$ = this.readySubject.asObservable();

  resolve(authenticated: boolean): void {
    this.isAuthenticated.set(authenticated);
    this.loading.set(false);
    this.readySubject.next(true);
  }
}

const state = (url: string) => ({ url } as RouterStateSnapshot);

describe('authGuard', () => {
  let auth: MockAuthService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useClass: MockAuthService },
      ],
    });
    auth = TestBed.inject(AuthService) as unknown as MockAuthService;
    router = TestBed.inject(Router);
  });

  const run = (url: string) =>
    TestBed.runInInjectionContext(() => authGuard({} as never, state(url)));

  it('allows an authenticated user through', () => {
    auth.resolve(true);
    expect(run('/dashboard')).toBe(true);
  });

  it('redirects a signed-out user to /login with returnUrl', () => {
    auth.resolve(false);
    const result = run('/dashboard') as UrlTree;
    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result)).toBe('/login?returnUrl=%2Fdashboard');
  });

  it('waits for auth to resolve before deciding', async () => {
    const pending = run('/premium') as Observable<boolean | UrlTree>;
    const decision = firstValueFrom(pending);
    auth.resolve(true);
    expect(await decision).toBe(true);
  });
});

describe('guestGuard', () => {
  let auth: MockAuthService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useClass: MockAuthService },
      ],
    });
    auth = TestBed.inject(AuthService) as unknown as MockAuthService;
    router = TestBed.inject(Router);
  });

  const run = () =>
    TestBed.runInInjectionContext(() => guestGuard({} as never, state('/login')));

  it('lets a signed-out visitor reach the auth pages', () => {
    auth.resolve(false);
    expect(run()).toBe(true);
  });

  it('sends an authenticated user to the dashboard instead', () => {
    auth.resolve(true);
    const result = run() as UrlTree;
    expect(router.serializeUrl(result)).toBe('/dashboard');
  });
});
