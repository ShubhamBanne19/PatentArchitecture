import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';

export interface SiteConfig {
  launchDate: string;
  launchDateDisplay: string;
  amazonUrl: string;
  isLive: boolean;
  bookTitle: string;
  author: string;
}

@Injectable({ providedIn: 'root' })
export class SiteConfigService {
  private http = inject(HttpClient);

  readonly config$: Observable<SiteConfig> = this.http
    .get<SiteConfig>('assets/content/site-config.json')
    .pipe(shareReplay(1));
}
