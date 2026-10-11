/**
 * In-flight sharing for identical, PUBLIC catalog SQL reads. Unlike a cache,
 * a settled value is never reused by a later request.
 *
 * Bounded to avoid storing untrusted query combinations indefinitely.
 * Mutations and authenticated per-user operations must not use this helper.
 */
const pendingCatalogReads = new Map<string, Promise<unknown>>();
const MAX_ACTIVE_READS = 64;
const MAX_KEY_LENGTH = 8_192;

export function coalesceCatalogRead<T>(key: string, read: () => Promise<T>): Promise<T> {
  const existing = pendingCatalogReads.get(key);
  if (existing) return existing as Promise<T>;
  if (key.length > MAX_KEY_LENGTH || pendingCatalogReads.size >= MAX_ACTIVE_READS) {
    return Promise.resolve().then(read);
  }
  const task = Promise.resolve().then(read);
  pendingCatalogReads.set(key, task);
  const clear = () => {
    if (pendingCatalogReads.get(key) === task) pendingCatalogReads.delete(key);
  };
  // Attach both handlers: rejected reads are never retained or handled by a
  // stray, rejected .finally() promise.
  void task.then(clear, clear);
  return task;
}
