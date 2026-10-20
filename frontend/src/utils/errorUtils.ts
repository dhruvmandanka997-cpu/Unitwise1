/**
 * Error Normalization Utility for UnitWise / LessonCraft AI
 * Safely parses, sanitizes, and normalizes errors from API responses,
 * network failures, and JavaScript exceptions.
 * Guarantees that users never see "[object Object]".
 */

export interface NormalizedError {
  message: string;
  code?: string;
  status?: number;
  correlationId: string;
  originalError?: unknown;
}

export function generateCorrelationId(): string {
  return 'err_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

// Regex to detect and redact sensitive credentials from error strings
const SENSITIVE_PATTERNS = [
  /AIza[0-9A-Za-z-_]{35}/g, // Google API keys
  /sk-[a-zA-Z0-9_-]{20,}/g, // OpenAI/Anthropic keys
  /Bearer\s+[a-zA-Z0-9_\-\.]+/gi,
  /password=[^&\s]+/gi,
];

export function sanitizeErrorMessage(msg: string): string {
  if (!msg || typeof msg !== 'string') return '';
  let sanitized = msg;
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }
  return sanitized.trim();
}

/**
 * Extracts a clean, human-readable string message from any error or payload.
 */
export function extractErrorMessage(
  err: unknown,
  defaultFallback = 'The AI service is temporarily unavailable. Please try again.'
): { message: string; code?: string; status?: number } {
  if (!err) {
    return { message: defaultFallback };
  }

  // 1. If it's already a string
  if (typeof err === 'string') {
    const trimmed = err.trim();
    if (trimmed && trimmed !== '[object Object]') {
      return { message: sanitizeErrorMessage(trimmed) };
    }
    return { message: defaultFallback };
  }

  // 2. If it's an Error instance
  if (err instanceof Error) {
    const rawMsg = err.message?.trim();
    const status = (err as any).status || (err as any).statusCode;
    const code = (err as any).code;

    // Check for network errors (Failed to fetch, CORS, offline)
    if (err.name === 'TypeError' && rawMsg.toLowerCase().includes('failed to fetch')) {
      return {
        message: 'Unable to connect to the backend server. Please verify your network connection or API URL.',
        code: 'NETWORK_ERROR',
        status,
      };
    }

    if (rawMsg && rawMsg !== '[object Object]') {
      return {
        message: sanitizeErrorMessage(rawMsg),
        code,
        status,
      };
    }

    // If message is "[object Object]", inspect custom properties on the error
    if ((err as any).raw) {
      return extractErrorMessage((err as any).raw, defaultFallback);
    }
    if ((err as any).data) {
      return extractErrorMessage((err as any).data, defaultFallback);
    }
  }

  // 3. If it's an object (parsed JSON error payload, Vercel error, or Google API response)
  if (typeof err === 'object' && err !== null) {
    const obj = err as Record<string, any>;
    const status = obj.status || obj.statusCode;
    const code = obj.code || (typeof obj.error === 'object' && obj.error?.code ? obj.error.code : undefined);

    // Vercel serverless error formats:
    // { error: { code: 'FUNCTION_INVOCATION_TIMEOUT', message: '...' } }
    // { error: { code: 'FUNCTION_INVOCATION_FAILED', ... } }
    if (typeof obj.error === 'object' && obj.error !== null) {
      const nested = obj.error;
      if (nested.code === 'FUNCTION_INVOCATION_TIMEOUT' || nested.message?.includes('timed out')) {
        return {
          message: 'The AI generation request timed out on the serverless runtime. Please retry or adjust schedule constraints.',
          code: 'TIMEOUT',
          status: status || 504,
        };
      }
      if (typeof nested.message === 'string' && nested.message.trim() && nested.message !== '[object Object]') {
        return {
          message: sanitizeErrorMessage(nested.message),
          code: nested.code || code,
          status,
        };
      }
    }

    // Top-level message string
    if (typeof obj.message === 'string' && obj.message.trim() && obj.message !== '[object Object]') {
      return { message: sanitizeErrorMessage(obj.message), code, status };
    }

    // Top-level error string
    if (typeof obj.error === 'string' && obj.error.trim() && obj.error !== '[object Object]') {
      return { message: sanitizeErrorMessage(obj.error), code, status };
    }

    // Array of validation issues (e.g. Zod or field validation)
    if (Array.isArray(obj.issues)) {
      const issues = obj.issues.map((i: any) => i.message || String(i)).filter(Boolean);
      if (issues.length > 0) {
        return { message: sanitizeErrorMessage(issues.join(', ')), code: 'VALIDATION_ERROR', status: 400 };
      }
    }

    if (Array.isArray(obj.errors)) {
      const errors = obj.errors.map((e: any) => (typeof e === 'string' ? e : e?.message || '')).filter(Boolean);
      if (errors.length > 0) {
        return { message: sanitizeErrorMessage(errors.join(', ')), code: 'VALIDATION_ERROR', status: 400 };
      }
    }

    if (Array.isArray(obj.error)) {
      const errors = obj.error.map((e: any) => (typeof e === 'string' ? e : e?.message || '')).filter(Boolean);
      if (errors.length > 0) {
        return { message: sanitizeErrorMessage(errors.join(', ')), code: 'VALIDATION_ERROR', status: 400 };
      }
    }

    // Specific known codes
    if (code === 'ACTIVE_LIMIT_REACHED') {
      return {
        message: obj.error || 'Active lesson plan limit reached. You can only have 3 active plans at once.',
        code,
        status: status || 409,
      };
    }
  }

  return { message: defaultFallback };
}

/**
 * Normalizes an unknown error into a structured NormalizedError with correlation ID and logging.
 */
export function normalizeError(
  err: unknown,
  defaultFallback = 'The AI service is temporarily unavailable. Please try again.'
): NormalizedError {
  const correlationId = generateCorrelationId();
  const extracted = extractErrorMessage(err, defaultFallback);

  // Safe developer logging (never leaking sensitive keys)
  const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV
    ? process.env.NODE_ENV !== 'production'
    : Boolean((import.meta as any)?.env?.DEV);

  if (isDev) {
    console.debug(`[Error ${correlationId}] Diagnostic details:`, err);
  } else {
    console.warn(`[Error ${correlationId}] Safe diagnostic: Code=${extracted.code || 'UNKNOWN'}, Status=${extracted.status || 'N/A'}`);
  }

  return {
    message: extracted.message,
    code: extracted.code,
    status: extracted.status,
    correlationId,
    originalError: err,
  };
}
