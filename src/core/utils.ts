import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import type { JsonValue, PollingOptions } from '../types';

export function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

export function buildUrl(baseUrl: string, path: string, query?: Record<string, string | number | boolean | null | undefined>): URL {
  const url = new URL(path.replace(/^\//, ''), `${trimTrailingSlash(baseUrl)}/`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url;
}

export function serializeBody(body: JsonValue | undefined): string | undefined {
  if (body === undefined) return undefined;
  return JSON.stringify(body);
}

export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason ?? new Error('Polling aborted'));
    };

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export function computeBackoff(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  return Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
}

export function ensureIdempotencyKey(value?: string): string {
  return value ?? randomUUID();
}

export function unwrapData<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

export function toArrayResult<T>(payload: unknown): T[] {
  const value = unwrapData<unknown>(payload);
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object' && 'rows' in (value as Record<string, unknown>)) {
    return (((value as Record<string, unknown>).rows as T[]) ?? []);
  }
  return [];
}

export async function poll<T>(fn: () => Promise<T>, isDone: (value: T) => boolean, options: PollingOptions = {}): Promise<T> {
  const intervalMs = options.intervalMs ?? 1_000;
  const timeoutMs = options.timeoutMs ?? 60_000;
  const startedAt = Date.now();

  for (;;) {
    if (options.signal?.aborted) throw options.signal.reason ?? new Error('Polling aborted');
    const value = await fn();
    if (isDone(value)) return value;
    if (Date.now() - startedAt >= timeoutMs) throw new Error(`Polling timeout after ${timeoutMs}ms`);
    await sleep(intervalMs, options.signal);
  }
}

export function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function verifyWebhookSignature(payload: string, secret: string, signature: string): boolean {
  const expected = sha256Hex(`${secret}:${payload}`);
  const left = Buffer.from(expected, 'hex');
  const right = Buffer.from(signature, 'hex');
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}