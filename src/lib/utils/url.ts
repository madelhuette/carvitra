/**
 * URL Helper Utilities
 * Dynamische URL-Generierung für verschiedene Umgebungen
 */

/**
 * Ermittelt die Base URL der Anwendung
 * Nutzt Umgebungsvariablen oder Request-Header
 */
export function getBaseUrl(request?: Request): string {
  // 1. Priorität: Explizit gesetzte App URL (für Production)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // 2. Server-seitig: Vercel URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // 3. Aus Request-Header extrahieren
  if (request) {
    const host = request.headers.get('host');
    if (host) {
      const protocol = host.includes('localhost') ? 'http' : 'https';
      return `${protocol}://${host}`;
    }
  }

  // 4. Client-seitig: Window Location
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // 5. Fallback: Development Default (Port 3000 wegen Server-Management)
  return 'http://localhost:3000';
}

/**
 * Generiert eine absolute URL für einen Pfad
 */
export function getAbsoluteUrl(path: string, request?: Request): string {
  const baseUrl = getBaseUrl(request);
  // Stelle sicher, dass der Pfad mit / beginnt
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Prüft ob wir in Development sind
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Prüft ob wir in Production sind
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}