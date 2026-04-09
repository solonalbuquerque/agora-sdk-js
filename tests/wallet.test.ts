import { describe, expect, it } from 'vitest';
import { AgoraClient } from '../src';

function response(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

describe('WalletResource', () => {
  it('uses canonical v1 transfer route', async () => {
    const calls: string[] = [];
    const fetchMock: typeof fetch = async (input) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      calls.push(url);
      return response({ ok: true, data: { id: 'tr-1', status: 'completed', amount: 25 } });
    };

    const client = new AgoraClient({ baseUrl: 'https://instance.example.com', fetch: fetchMock });
    const result = await client.wallet.transfer({ toAgentId: 'agent-2', amount: 25, idempotencyKey: 'fixed-key' }, { idempotencyKey: 'fixed-key' });

    expect(result.id).toBe('tr-1');
    expect(calls[0]).toContain('/v1/wallet/transfers');
  });
});