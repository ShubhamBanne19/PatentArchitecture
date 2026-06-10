import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const subscriptionGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const decide = () => {
    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    }
    return auth.isSubscribed()
      ? true
      : router.createUrlTree(['/premium'], { queryParams: { paywall: '1' } });
  };

  if (!auth.loading()) {
    return decide();
  }

  return auth.ready$.pipe(
    filter(Boolean),
    take(1),
    map(decide)
  );
};
