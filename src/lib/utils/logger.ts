/**
 * Zentralisiertes Logging-System für CARVITRA
 * 
 * Nutzt console.log nur in Development-Umgebung
 * In Production werden alle Debug-Logs unterdrückt
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * Debug-Logs (nur in Development)
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Info-Logs (nur in Development)
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info('[INFO]', ...args);
    }
  },

  /**
   * Warnungen (immer anzeigen)
   */
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
  },

  /**
   * Fehler (immer anzeigen)
   */
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  },

  /**
   * API-spezifische Logs (nur in Development)
   */
  api: (endpoint: string, method: string, data?: any) => {
    if (isDevelopment) {
      console.log(`[API] ${method} ${endpoint}`, data || '');
    }
  },

  /**
   * Service-spezifische Logs (nur in Development)
   */
  service: (service: string, action: string, data?: any) => {
    if (isDevelopment) {
      console.log(`[${service.toUpperCase()}] ${action}`, data || '');
    }
  }
};

export default logger;