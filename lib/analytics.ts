/**
 * Melhora Prudente - Analytics & Observability Engine
 * Integrated support for:
 * - Google Analytics 4 (GA4) with correct App Router navigation tracking
 * - Microsoft Clarity (for screen recording, clickmaps, session analytics)
 * - Safe error logging / future Sentry readiness
 * - Strict LGPD/GDPR compliance: respects Do-Not-Track, anonymizes IP, no sensitive data capture (no JWT, no passwords, no email)
 */

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-MELHORAPRUDENTE';
export const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_ID || 'clarity-mp';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    clarity?: (...args: any[]) => void;
    doNotTrack?: string;
  }
}

// Helpers for privacy-safe tracking
const isTrackingAllowed = (): boolean => {
  if (typeof window === 'undefined') return false;
  // Respect Do Not Track header if set
  const dnt = navigator.doNotTrack || window.doNotTrack;
  if (dnt === '1' || dnt === 'yes') return false;
  return true;
};

/**
 * Filter out any potentially sensitive patterns from data strings before sending to external services
 */
export const sanitizeData = (text: any): any => {
  if (typeof text !== 'string') return text;
  
  // Remove patterns resembling JWT tokens, bearer tokens, passwords or email addresses
  let cleanText = text;
  
  // JWT pattern
  cleanText = cleanText.replace(/eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g, '[REDACTED_JWT]');
  // Email pattern
  cleanText = cleanText.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');
  // Bearer Token pattern
  cleanText = cleanText.replace(/Bearer\s+[A-Za-z0-9-._~+/]+/gi, 'Bearer [REDACTED_TOKEN]');
  // Password pattern inside JSON/forms
  cleanText = cleanText.replace(/(password|senha)["']?\s*:\s*["'][^"']+["']/gi, '$1: "[REDACTED]"');
  
  return cleanText;
};

/**
 * Track a Page View event manually (useful for App Router navigation)
 */
export const trackPageView = (url: string) => {
  if (!isTrackingAllowed()) return;
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
      anonymize_ip: true, // LGPD compliance
    });
  }
};

/**
 * Send custom analytics event safely to Google Analytics and Microsoft Clarity
 */
export const trackEvent = (
  action: string,
  params: {
    category?: string;
    label?: string;
    value?: number;
    [key: string]: any;
  } = {}
) => {
  if (!isTrackingAllowed()) return;

  // Sanitize all values to ensure no sensitive tokens leak
  const sanitizedParams: Record<string, any> = {};
  for (const [key, val] of Object.entries(params)) {
    sanitizedParams[key] = sanitizeData(val);
  }

  // Set default event category if not present
  if (!sanitizedParams.category) {
    sanitizedParams.category = 'General';
  }

  // 1. Send to Google Analytics 4
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: sanitizedParams.category,
      event_label: sanitizedParams.label,
      value: sanitizedParams.value,
      ...sanitizedParams,
    });
  }

  // 2. Send to Microsoft Clarity
  if (typeof window !== 'undefined' && window.clarity) {
    try {
      window.clarity('event', action);
    } catch (e) {
      console.warn('Failed sending event to Microsoft Clarity', e);
    }
  }

  // 3. Simple log in dev environment for auditing
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[Analytics Event] Action: "${action}"`, sanitizedParams);
  }
};

/**
 * Capture exceptions and forward them to external monitoring safely (observability)
 */
export const trackException = (error: Error | string, fatal = false) => {
  const errorMessage = error instanceof Error ? error.message : error;
  const sanitizedError = sanitizeData(errorMessage);
  const stack = error instanceof Error ? error.stack : '';

  // Prevent detailed stack traces from being sent to GA/Clarity to keep logs clean and safe,
  // but track the core exception message.
  if (!isTrackingAllowed()) {
    console.error(`[Obs - Local Error Log] ${sanitizedError}`, stack);
    return;
  }

  // Send to GA4
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'exception', {
      description: sanitizedError,
      fatal: fatal,
    });
  }

  // Local warning in development/production console without exposure of variables
  console.error(`[Obs - Tracked Exception] ${sanitizedError}`);
};
