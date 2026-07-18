import { HttpEvent, HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, from } from 'rxjs';

/**
 * Server-only interceptor that resolves relative `assets/...` HTTP requests
 * from the local filesystem during prerendering.
 *
 * The app loads all public content (chapters, fees, prompts, blog markdown)
 * via HttpClient with relative URLs. In the browser those resolve against the
 * origin; during prerendering there is no origin, so without this interceptor
 * every content fetch would fail and the prerendered HTML would be an empty
 * shell — defeating the point of prerendering.
 *
 * Only wired up in app.config.server.ts; never part of the browser bundle.
 */
export function serverAssetsInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  if (req.method === 'GET' && req.url.startsWith('assets/')) {
    return from(readAssetFromDisk(req));
  }
  return next(req);
}

// Shared services fetch the same JSON (chapters, prompts, site config) on
// nearly every route; without this cache each of the 38 prerendered routes
// re-reads them from disk.
const fileCache = new Map<string, Promise<string>>();

async function readAssetFromDisk(req: HttpRequest<unknown>): Promise<HttpEvent<unknown>> {
  let pending = fileCache.get(req.url);
  if (!pending) {
    pending = (async () => {
      const { readFile } = await import('node:fs/promises');
      const { join } = await import('node:path');
      // Prerendering runs from the workspace root; src/assets is the source of
      // truth for everything the build copies to /assets.
      return readFile(join(process.cwd(), 'src', req.url), 'utf-8');
    })();
    fileCache.set(req.url, pending);
  }

  const text = await pending;
  const body: unknown = req.responseType === 'json' ? JSON.parse(text) : text;
  return new HttpResponse({ status: 200, url: req.url, body });
}
