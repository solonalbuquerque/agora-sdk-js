import { describe, expect, it } from 'vitest';
import { createHmacAuth } from '../src';

function createContext() {
  return {
    method: 'POST' as const,
    path: '/api/external/executions',
    url: new URL('https://instance.example.com/api/external/executions'),
    body: { serviceCode: 'svc.echo', input: { hello: 'world' } },
    headers: new Headers(),
    options: {},
  };
}

describe('HmacAuthProvider', () => {
  it('adds the expected headers', async () => {
    const auth = createHmacAuth({ agentId: 'agent-123', secret: 'top-secret' });
    const context = createContext();

    await auth.apply(context);

    expect(context.headers.get('X-Agent-Id')).toBe('agent-123');
    expect(context.headers.get('X-Timestamp')).toBeTruthy();
    expect(context.headers.get('X-Signature')).toMatch(/^[a-f0-9]{64}$/);
  });
});