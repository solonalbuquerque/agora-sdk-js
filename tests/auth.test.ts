import { describe, expect, it } from 'vitest';
import { AgoraAuthError, createApiKeyAuth, createEd25519Auth, createHmacAuth, createJwtAuth } from '../src';

function createContext() {
  return {
    method: 'POST' as const,
    path: '/api/external/executions',
    url: new URL('https://instance.example.com/api/external/executions'),
    body: { capabilityCode: 'svc.echo', serviceCode: 'svc.echo', input: { hello: 'world' } },
    headers: new Headers(),
    options: {},
  };
}

describe('auth providers', () => {
  it('adds HMAC headers', async () => {
    const auth = createHmacAuth({ agentId: 'agent-123', secret: 'top-secret' });
    const context = createContext();
    await auth.apply(context);
    expect(context.headers.get('X-Agent-Id')).toBe('agent-123');
    expect(context.headers.get('X-Timestamp')).toBeTruthy();
    expect(context.headers.get('X-Signature')).toMatch(/^[a-f0-9]{64}$/);
  });

  it('fails early on empty API key', () => {
    expect(() => createApiKeyAuth({ apiKey: '' })).toThrow(AgoraAuthError);
  });

  it('fails early on empty JWT', () => {
    expect(() => createJwtAuth({ token: '' })).toThrow(AgoraAuthError);
  });

  it('fails early on invalid HMAC config', () => {
    expect(() => createHmacAuth({ agentId: '', secret: '' })).toThrow(AgoraAuthError);
  });

  it('fails early on invalid Ed25519 key', () => {
    expect(() => createEd25519Auth({ privateKey: '' })).toThrow(AgoraAuthError);
  });
});
