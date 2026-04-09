import type {
  AgoraClientOptions,
  AgoraResponseEnvelope,
  AuthProvider,
  HttpMethod,
  JsonValue,
  RequestContext,
  RequestOptions,
} from '../types';
import { AgoraAuthError, AgoraError, AgoraRateLimitError, AgoraTimeoutError, AgoraValidationError } from './errors';
import { buildUrl, computeBackoff, serializeBody } from './utils';

export class HttpClient {
  private readonly fetchImpl: typeof fetch;
  private readonly baseUrl: string;
  private readonly auth?: AuthProvider;
  private readonly defaultHeaders: Record<string, string>;
  private readonly timeoutMs: number;
  private readonly userAgent?: string;
  private readonly retry: Required<NonNullable<AgoraClientOptions['retry']>>;

  constructor(options: AgoraClientOptions) {
    this.fetchImpl = options.fetch ?? globalThis.fetch;
    this.baseUrl = options.baseUrl;
    this.auth = options.auth;
    this.defaultHeaders = options.headers ?? {};
    this.timeoutMs = options.timeoutMs ?? 15_000;
    this.userAgent = options.userAgent;
    this.retry = {
      retries: options.retry?.retries ?? 2,
      baseDelayMs: options.retry?.baseDelayMs ?? 250,
      maxDelayMs: options.retry?.maxDelayMs ?? 2_000,
      retryOnStatuses: options.retry?.retryOnStatuses ?? [408, 409, 425, 429, 500, 502, 503, 504],
    };
  }

  async request<T>(method: HttpMethod, path: string, body?: JsonValue, options: RequestOptions = {}): Promise<T> {
    const url = buildUrl(this.baseUrl, path, options.query);
    const auth = options.auth ?? this.auth;
    const timeoutMs = options.timeoutMs ?? this.timeoutMs;
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.retry.retries; attempt += 1) {
      const headers = new Headers(this.defaultHeaders);
      headers.set('Accept', 'application/json');
      if (this.userAgent) headers.set('User-Agent', this.userAgent);
      if (body !== undefined) headers.set('Content-Type', 'application/json');
      if (options.idempotencyKey) headers.set('Idempotency-Key', options.idempotencyKey);
      for (const [key, value] of Object.entries(options.headers ?? {})) headers.set(key, value);

      const requestContext: RequestContext = { method, path, url, body, headers, options };
      if (auth) await auth.apply(requestContext);

      const abortController = new AbortController();
      const onAbort = () => abortController.abort(options.signal?.reason);
      options.signal?.addEventListener('abort', onAbort, { once: true });
      const timer = setTimeout(() => abortController.abort(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs);

      try {
        const response = await this.fetchImpl(url, {
          method,
          headers,
          body: serializeBody(body),
          signal: abortController.signal,
        });
        return await parseResponse<T>(response, options.responseType ?? 'json');
      } catch (error) {
        lastError = error;
        if (abortController.signal.aborted && !options.signal?.aborted) {
          throw new AgoraTimeoutError(`Request timeout after ${timeoutMs}ms`, { cause: error });
        }
        if (attempt >= this.retry.retries) throw normalizeFetchError(error);
        const status = extractStatus(error);
        if (status !== undefined && !this.retry.retryOnStatuses.includes(status)) throw normalizeFetchError(error);
        const delay = computeBackoff(attempt, this.retry.baseDelayMs, this.retry.maxDelayMs);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } finally {
        clearTimeout(timer);
        options.signal?.removeEventListener('abort', onAbort);
      }
    }

    throw normalizeFetchError(lastError);
  }

  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request('GET', path, undefined, options);
  }

  post<T>(path: string, body?: JsonValue, options?: RequestOptions): Promise<T> {
    return this.request('POST', path, body, options);
  }

  put<T>(path: string, body?: JsonValue, options?: RequestOptions): Promise<T> {
    return this.request('PUT', path, body, options);
  }

  patch<T>(path: string, body?: JsonValue, options?: RequestOptions): Promise<T> {
    return this.request('PATCH', path, body, options);
  }

  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request('DELETE', path, undefined, options);
  }
}

async function parseResponse<T>(response: Response, responseType: RequestOptions['responseType']): Promise<T> {
  if (responseType === 'raw') return response as T;
  const requestId = response.headers.get('X-Request-Id') ?? undefined;
  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const envelope = payload as AgoraResponseEnvelope<unknown>;
    const message = envelope?.message ?? response.statusText ?? 'AGORA request failed';
    const options = { status: response.status, code: envelope?.code, requestId, details: payload };
    if (response.status === 401 || response.status === 403) throw new AgoraAuthError(message, options);
    if (response.status === 429) throw new AgoraRateLimitError(message, { ...options, retryAfter: response.headers.get('retry-after') });
    if (response.status === 400 || response.status === 422) throw new AgoraValidationError(message, options);
    throw new AgoraError(message, options);
  }

  if (responseType === 'text') return payload as T;
  return payload as T;
}

function normalizeFetchError(error: unknown): Error {
  if (error instanceof Error) return error;
  return new AgoraError('Unknown fetch error', { details: error });
}

function extractStatus(error: unknown): number | undefined {
  return error instanceof AgoraError ? error.status : undefined;
}