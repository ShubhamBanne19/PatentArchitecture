import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { appConfig } from './app.config';
import { serverAssetsInterceptor } from './core/server/server-assets.interceptor';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    // Overrides the base provideHttpClient so relative assets/ URLs resolve
    // from disk while prerendering.
    provideHttpClient(withFetch(), withInterceptors([serverAssetsInterceptor])),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
