import { isValidUrl } from './urlValidator';
import { ReferenceLinkStatus } from '../../models/plan';

export type VerificationCheckResult = 'verified' | 'unverified' | 'failed';

export interface LinkVerificationResult {
  status: VerificationCheckResult;
  linkStatus: ReferenceLinkStatus;
  lastCheckedAt: string;
  statusCode?: number;
  errorReason?: string;
}

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 (Educational Research Bot)';

/**
 * Server-side reachability check for external references.
 * Respects SSRF protections, limits redirects, and honestly distinguishes
 * between actual reachable links, 404/410/DNS broken links, and anti-bot/timeout blocks.
 */
export async function verifyLink(url: string, timeoutMs = 4000): Promise<LinkVerificationResult> {
  const timestamp = new Date().toISOString();

  // 1. Validate URL protocol, structure, and SSRF restrictions
  if (!isValidUrl(url)) {
    return {
      status: 'failed',
      linkStatus: 'broken',
      lastCheckedAt: timestamp,
      errorReason: 'URL failed protocol or SSRF security validation',
    };
  }

  try {
    // 2. Attempt lightweight HEAD request
    let response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    // 3. Some servers return 405 Method Not Allowed or 403 on HEAD; fallback to lightweight GET
    if (response.status === 405 || response.status === 400) {
      response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Range': 'bytes=0-1024',
        },
      });
    }

    const code = response.status;

    // 200..299: Reachable and verified
    if (code >= 200 && code < 300) {
      return {
        status: 'verified',
        linkStatus: 'reachable',
        lastCheckedAt: timestamp,
        statusCode: code,
      };
    }

    // 404 Not Found, 410 Gone: Explicitly dead/broken link
    if (code === 404 || code === 410) {
      return {
        status: 'failed',
        linkStatus: 'broken',
        lastCheckedAt: timestamp,
        statusCode: code,
        errorReason: `HTTP ${code} resource not found`,
      };
    }

    // 403 Forbidden, 429 Too Many Requests, 503 Cloudflare/WAF: Anti-bot protection
    // This is NOT proof the link is dead for teachers clicking in a browser!
    if (code === 403 || code === 429 || code === 503 || code === 500) {
      return {
        status: 'unverified',
        linkStatus: 'blocked',
        lastCheckedAt: timestamp,
        statusCode: code,
        errorReason: `HTTP ${code} anti-bot or temporary server limit`,
      };
    }

    // Any other status: treat as not_checked / unverified
    return {
      status: 'unverified',
      linkStatus: 'not_checked',
      lastCheckedAt: timestamp,
      statusCode: code,
    };
  } catch (err: unknown) {
    const error = err as Error;

    // Distinguish between DNS not found and timeout
    if (error.name === 'TimeoutError' || error.message.includes('timeout') || error.message.includes('abort')) {
      return {
        status: 'unverified',
        linkStatus: 'not_checked',
        lastCheckedAt: timestamp,
        errorReason: 'Request timed out; marked not checked for manual review',
      };
    }

    if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo ENOTFOUND')) {
      return {
        status: 'failed',
        linkStatus: 'broken',
        lastCheckedAt: timestamp,
        errorReason: 'Domain DNS resolution failed',
      };
    }

    return {
      status: 'unverified',
      linkStatus: 'not_checked',
      lastCheckedAt: timestamp,
      errorReason: error.message || 'Connection check inconclusive',
    };
  }
}

export async function verifyResourceUrl(url: string, timeoutMs = 4000): Promise<{
  state: 'verified' | 'unverified' | 'failed';
  linkStatus: ReferenceLinkStatus;
  httpStatus?: number;
  lastCheckedAt: string;
}> {
  const result = await verifyLink(url, timeoutMs);
  return {
    state: result.status,
    linkStatus: result.linkStatus,
    httpStatus: result.statusCode,
    lastCheckedAt: result.lastCheckedAt,
  };
}

