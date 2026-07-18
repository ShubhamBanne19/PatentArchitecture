import { TestBed } from '@angular/core/testing';
import { Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { subscriptionGuard } from './subscription.guard';
import { AuthService } from '../services/auth.service';

class MockAuthService {
  loading = signal(false);
  isAuthenticated = signal(false);
  isSubscribed = signal(false);
  private readySubject = new BehaviorSubject(true);
  ready$ = this.readySubject.asObservable();
}

describe('subscriptionGuard', () => {
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
    TestBed.runInInjectionContext(() =>
      subscriptionGuard({} as never, { url: '/premium/extra-01' } as RouterStateSnapshot));

  it('redirects a signed-out user to /login with returnUrl', () => {
    const result = run() as UrlTree;
    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result)).toBe('/login?returnUrl=%2Fpremium%2Fextra-01');
  });

  it('sends a signed-in free user to the paywall', () => {
    auth.isAuthenticated.set(true);
    auth.isSubscribed.set(false);
    const result = run() as UrlTree;
    expect(router.serializeUrl(result)).toBe('/premium?paywall=1');
  });

  it('lets an active subscriber through', () => {
    auth.isAuthenticated.set(true);
    auth.isSubscribed.set(true);
    expect(run()).toBe(true);
  });
});
