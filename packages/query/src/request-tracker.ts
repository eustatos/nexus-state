import type { RequestTracker } from './types';

/**
 * Create a request tracker for deduplication
 */
export function createRequestTracker(): RequestTracker {
  const requests = new Map<string, Promise<unknown>>();

  const get = <TData>(queryKey: string): Promise<TData> | undefined => {
    return requests.get(queryKey) as Promise<TData> | undefined;
  };

  const set = <TData>(queryKey: string, promise: Promise<TData>): void => {
    requests.set(queryKey, promise);

    // Auto-cleanup when promise settles
    promise
      .then(() => requests.delete(queryKey))
      .catch(() => requests.delete(queryKey));
  };

  const remove = (queryKey: string): void => {
    requests.delete(queryKey);
  };

  const clear = (): void => {
    requests.clear();
  };

  const has = (queryKey: string): boolean => {
    return requests.has(queryKey);
  };

  return {
    get,
    set,
    remove,
    clear,
    has
  };
}
