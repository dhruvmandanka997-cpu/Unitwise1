/**
 * URL Validator & Normalizer with strict SSRF protection
 */

// Tracking parameters commonly appended by search engines, ad platforms, and social networks
const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'fbclid',
  'gclid',
  'gclsrc',
  'dclid',
  'zanpid',
  'msclkid',
  'ref',
  'source',
  '_ga',
  '_gl',
]);

// Private and reserved IP prefixes for SSRF protection
const PRIVATE_IP_REGEXES = [
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,                // Loopback (127.0.0.0/8)
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,                 // Private Class A (10.0.0.0/8)
  /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/,    // Private Class B (172.16.0.0/12)
  /^192\.168\.\d{1,3}\.\d{1,3}$/,                    // Private Class C (192.168.0.0/16)
  /^169\.254\.\d{1,3}\.\d{1,3}$/,                    // Link-Local (169.254.0.0/16)
  /^0\.0\.0\.0$/,                                    // Unspecified
  /^::1$/,                                           // IPv6 Loopback
  /^fc00:/i,                                         // IPv6 Unique Local Address
  /^fe80:/i,                                         // IPv6 Link-Local
];

export function isPrivateOrLocalIp(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (
    lower === 'localhost' ||
    lower.endsWith('.localhost') ||
    lower.endsWith('.local') ||
    lower.endsWith('.internal')
  ) {
    return true;
  }
  for (const regex of PRIVATE_IP_REGEXES) {
    if (regex.test(lower)) {
      return true;
    }
  }
  return false;
}

/**
 * Validates a URL against protocol rules, format requirements, and SSRF restrictions.
 */
export function isValidUrl(rawUrl: string): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  const trimmed = rawUrl.trim();

  // Reject explicit dangerous schemes before URL parser
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('file:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('blob:') ||
    lower.startsWith('about:')
  ) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);

    // Protocol must be https or standard http
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    // Must have a valid non-empty hostname
    if (!hostname || hostname.length < 3) {
      return false;
    }

    // Block localhost, internal names, and private/link-local IP addresses
    if (isPrivateOrLocalIp(hostname)) {
      return false;
    }

    // Restrict ports to standard web ports (80, 443, or empty default)
    if (parsed.port && parsed.port !== '80' && parsed.port !== '443') {
      return false;
    }

    // Must contain a dot in the hostname (e.g. domain.tld)
    if (!hostname.includes('.')) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Normalizes a URL:
 * - Lowercases hostname
 * - Strips marketing tracking parameters
 * - Removes unnecessary default ports and hash fragments
 */
export function normalizeUrl(rawUrl: string): string {
  if (!isValidUrl(rawUrl)) {
    return rawUrl;
  }

  try {
    const parsed = new URL(rawUrl.trim());
    parsed.hostname = parsed.hostname.toLowerCase();

    // Delete tracking search parameters
    const toDelete: string[] = [];
    parsed.searchParams.forEach((_, key) => {
      if (TRACKING_PARAMS.has(key.toLowerCase()) || key.startsWith('utm_')) {
        toDelete.push(key);
      }
    });
    for (const key of toDelete) {
      parsed.searchParams.delete(key);
    }

    // Strip hash fragment for clean deduplication
    parsed.hash = '';

    // If search params are empty, clean up query string
    let normalized = parsed.toString();
    if (normalized.endsWith('/') && parsed.pathname === '/' && !parsed.search) {
      // Keep root trailing slash for consistency
    } else if (normalized.endsWith('/') && parsed.pathname.length > 1) {
      normalized = normalized.slice(0, -1);
    }

    return normalized;
  } catch {
    return rawUrl;
  }
}

export function validateAndSanitizeUrl(rawUrl: string): { valid: boolean; normalizedUrl?: string; error?: string } {
  if (!isValidUrl(rawUrl)) {
    return { valid: false, error: 'Invalid URL or blocked by security policy' };
  }
  return { valid: true, normalizedUrl: normalizeUrl(rawUrl) };
}

export const normalizeUrlForDedup = normalizeUrl;

