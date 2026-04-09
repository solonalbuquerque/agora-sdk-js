import { describe, expect, it } from 'vitest';
import {
  AgoraApiError,
  AgoraAuthError,
  AgoraClient,
  AgoraIdempotencyConflictError,
  AgoraRateLimitError,
  AgoraTimeoutError,
  AgoraValidationError,
} from '../src';

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
  });
}

describe('HttpClient transport', () => {

  it('retries GET requests by default', async () => {
    let calls = 0;
    const client = new AgoraClient({
      baseUrl: 'https://instance.example.com',
      fetch: async () => {
        calls += 1;
        if (calls < 3) return jsonResponse({ ok: false, code: 'TEMP', message: 'retry' }, { status: 503 });
        return jsonResponse({ ok: true, data: { value: 1 } });
      },
    });

    const result = await client.http.get<{ ok: boolean; data: { value: number } }>('/test');
    expect(result.data.value).toBe(1);
    expect(calls).toBe(3);
  });

  it('does not retry unsafe POST without idempotency key', async () => {
    let calls = 0;
    const client = new AgoraClient({
      baseUrl: 'https://instance.example.com',
      fetch: async () => {
        calls += 1;
        return jsonResponse({ ok: false, code: 'TEMP', message: 'retry' }, { status: 503 });
      },
    });

    await expect(client.http.post('/test', { hello: 'world' })).rejects.toBeInstanceOf(AgoraApiError);
    expect(calls).toBe(1);
  });

  it('retries idempotent POST when idempotency key is present', async () => {
    let calls = 0;
    const client = new AgoraClient({
      baseUrl: 'https://instance.example.com',
      fetch: async () => {
        calls += 1;
        if (calls < 2) return jsonResponse({ ok: false, code: 'TEMP', message: 'retry' }, { status: 503 });
        return jsonResponse({ ok: true, data: { value: 1 } });
      },
    });

    const result = await client.http.post<{ ok: boolean; data: { value: number } }>('/test', { hello: 'world' }, { idempotencyKey: 'idem-1' });
    expect(result.data.value).toBe(1);
    expect(calls).toBe(2);
  });

  it('passes custom headers', async () => {
    let headerValue = '';
    const client = new AgoraClient({
      baseUrl: 'https://instance.example.com',
      fetch: async (_input, init) => {
        headerValue = String((init?.headers as Headers).get('X-Custom-Header'));
        return jsonResponse({ ok: true, data: { ok: true } });
      },
    });

    await client.http.get('/test', { headers: { 'X-Custom-Header': 'abc' } });
    expect(headerValue).toBe('abc');
  });

  it('maps timeout errors', async () => {
    const client = new AgoraClient({
      baseUrl: 'https://instance.example.com',
      fetch: async (_input, init) => {
        await new Promise((resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        });
        return jsonResponse({});
      },
      timeoutMs: 5,
      retry: { retries: 0 },
    });

    await expect(client.http.get('/slow')).rejects.toBeInstanceOf(AgoraTimeoutError);
  });
});

describe('HttpClient error parsing', () => {
  it('maps auth errors', async () => {
    const client = new AgoraClient({ baseUrl: 'https://instance.example.com', fetch: async () => jsonResponse({ ok: false, code: 'AUTH', message: 'nope' }, { status: 401 }) });
    await expect(client.http.get('/auth')).rejects.toBeInstanceOf(AgoraAuthError);
  });

  it('maps validation errors', async () => {
    const client = new AgoraClient({ baseUrl: 'https://instance.example.com', fetch: async () => jsonResponse({ ok: false, code: 'VALIDATION', message: 'bad' }, { status: 422 }) });
    await expect(client.http.get('/validation')).rejects.toBeInstanceOf(AgoraValidationError);
  });

  it('maps idempotency conflicts', async () => {
    const client = new AgoraClient({ baseUrl: 'https://instance.example.com', fetch: async () => jsonResponse({ ok: false, code: 'IDEMPOTENCY_CONFLICT', message: 'dupe' }, { status: 409 }) });
    await expect(client.http.post('/idempotent', {}, { idempotencyKey: 'same' })).rejects.toBeInstanceOf(AgoraIdempotencyConflictError);
  });

  it('maps rate limits', async () => {
    const client = new AgoraClient({ baseUrl: 'https://instance.example.com', fetch: async () => jsonResponse({ ok: false, code: 'RATE_LIMIT', message: 'slow down' }, { status: 429, headers: { 'retry-after': '10' } }) });
    await expect(client.http.get('/rate')).rejects.toBeInstanceOf(AgoraRateLimitError);
  });
});

