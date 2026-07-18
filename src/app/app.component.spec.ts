import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { AppComponent } from './app.component';
import { AuthService } from './core/services/auth.service';

/** Signed-out AuthService stub — keeps Firebase out of the TestBed. */
class MockAuthService {
  loading = signal(false);
  firebaseUser = signal(null);
  profile = signal(null);
  isAuthenticated = signal(false);
  isSubscribed = signal(false);
  ready$ = of(true);
  user$ = of(null);
}

describe('AppComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [AppComponent],
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: AuthService, useClass: MockAuthService },
    ],
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the shell with skip-link target, header, and footer', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('main#main-content')).toBeTruthy();
    expect(compiled.querySelector('pa-header')).toBeTruthy();
    expect(compiled.querySelector('pa-footer')).toBeTruthy();
  });
});
