/**
 * WEB-005 Issue #70: pure static/SPA route classifier.
 *
 * Adapter contract: caller MUST use an accurate built-public-root existence
 * check and MUST translate `not_found` to an actual HTTP 404. The existence
 * checker MUST return a synchronous boolean; Promise/thenable/non-boolean
 * results and exceptions fail closed to `not_found`. This module
 * performs no filesystem, network or deployment operations and is not wired
 * into the current Replit static deployment.
 */
const STATIC_DIRECTORIES = new Map([
  ['/portfolio', '/portfolio/index.html'],
  ['/portfolio/projects', '/portfolio/projects/index.html'],
  ['/stream/animated-effects', '/stream/animated-effects/index.html'],
]);

const RESERVED_PREFIXES = [
  '/api',
  '/assets',
  '/fonts',
  '/portfolio',
  '/prototypes',
  '/stream/animated-effects',
  '/dev/animated-effects',
];

function inPrefix(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Safely determine existence without accidentally treating a Promise as true. */
function checkedExists(exists, path) {
  try {
    const result = exists(path);
    if (typeof result === 'boolean') return result;
    // A rejected async probe must not cause an unhandledRejection in callers
    // of a synchronous helper. Its result remains untrusted either way.
    if (result !== null && (typeof result === 'object' || typeof result === 'function')) {
      void Promise.resolve(result).catch(() => {});
    }
  } catch {
    // A storage/access error is never evidence that the asset exists.
  }
  return null; // UNKNOWN, distinct from a confirmed synchronous false.
}

/**
 * @param {string} urlPath Requested URL path, optionally with query string.
 * @param {(path:string) => boolean} exists Synchronous existence predicate; other results deny.
 * @returns {{kind:'static', path:string}|{kind:'spa', path:'/index.html'}|{kind:'not_found'|'invalid_path',path:string}}
 */
export function resolveStaticRoute(urlPath, exists) {
  if (typeof urlPath !== 'string' || typeof exists !== 'function') {
    throw new TypeError('resolveStaticRoute requires a URL path and synchronous exists(path) predicate');
  }
  if (!urlPath.startsWith('/') || urlPath.startsWith('//')) {
    return { kind: 'invalid_path', path: urlPath };
  }
  const beforeQuery = urlPath.split(/[?#]/, 1)[0];
  let decoded;
  try {
    decoded = decodeURIComponent(beforeQuery);
  } catch {
    return { kind: 'invalid_path', path: beforeQuery };
  }
  if (decoded.includes('\\') || decoded.includes('\0') || decoded.includes('//') ||
      decoded.split('/').some(p => p === '.' || p === '..')) {
    return { kind: 'invalid_path', path: beforeQuery };
  }
  // Do not let an encoded slash transform an asset path into a different path.
  if (/%2f|%5c/i.test(beforeQuery)) {
    return { kind: 'invalid_path', path: beforeQuery };
  }

  // Existing assets ALWAYS win over SPA fallbacks (including binary Unity files).
  const directlyPresent = checkedExists(exists, decoded);
  if (directlyPresent === null) return { kind: 'not_found', path: decoded };
  if (directlyPresent) return { kind: 'static', path: decoded };

  // Only known, physically present directory indexes receive a clean URL.
  const directory = decoded.endsWith('/') && decoded !== '/'
    ? decoded.slice(0, -1) : decoded;
  const index = STATIC_DIRECTORIES.get(directory);
  if (index) {
    const indexPresent = checkedExists(exists, index);
    return indexPresent === true
      ? { kind: 'static', path: index }
      : { kind: 'not_found', path: decoded };
  }

  // Static namespaces MUST fail closed when their requested file is absent.
  if (RESERVED_PREFIXES.some(prefix => inPrefix(decoded, prefix))) {
    return { kind: 'not_found', path: decoded };
  }

  // Unknown file-like URLs (.ttf/.wasm/.js/.html/...): no misleading HTML 200.
  const last = decoded.slice(decoded.lastIndexOf('/') + 1);
  if (/\.[a-z\d]{1,16}$/i.test(last)) {
    return { kind: 'not_found', path: decoded };
  }

  // Only extensionless app navigation receives index.html. Unknown SPA paths
  // intentionally retain the client app's NotFound handling on direct reload.
  return { kind: 'spa', path: '/index.html' };
}

export const STATIC_ROUTE_POLICY_VERSION = 'WEB005-ISSUE70-V1';
