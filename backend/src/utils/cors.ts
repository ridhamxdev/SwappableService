import cors, { CorsOptions } from 'cors';

/** Split comma-separated env into trimmed items. */
function parseOrigins(value?: string): string[] {
  if (!value || value.trim() === '') return ['*'];
  return value.split(',').map(s => s.trim()).filter(Boolean);
}

/** Turn a pattern with * wildcards into a RegExp. */
function wildcardToRegex(pattern: string): RegExp {
  // escape regex chars, then restore .* for *
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`, 'i');
}

/** Decide if a request origin is allowed by the patterns. */
function isAllowed(origin: string | undefined, patterns: string[]): boolean {
  // Non-browser requests (curl, server-to-server) often have no origin; allow them.
  if (!origin) return true;

  if (patterns.includes('*')) return true;

  for (const p of patterns) {
    // Exact match
    if (!p.includes('*') && origin === p) return true;

    // Wildcard match (e.g., https://*.example.com, http://localhost:*)
    if (p.includes('*')) {
      const re = wildcardToRegex(p);
      if (re.test(origin)) return true;
    }
  }
  return false;
}

let cachedAllowed: string[] = parseOrigins(process.env.CORS_ORIGIN);

/** Rebuild allowed list (useful if env can change). */
export function refreshAllowedOrigins() {
  cachedAllowed = parseOrigins(process.env.CORS_ORIGIN);
  return cachedAllowed;
}

/** Expose current list for logging. */
export function getAllowedOrigins() {
  return cachedAllowed.slice();
}

/** Create the CORS middleware with dynamic origin checking. */
export function corsMiddleware() {
  const options: CorsOptions = {
    origin(origin, cb) {
      try {
        cb(null, isAllowed(origin, cachedAllowed));
      } catch (err) {
        cb(err as Error);
      }
    },
    credentials: true, // allow cookies/authorization headers
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
    preflightContinue: false
  };

  return cors(options);
}
