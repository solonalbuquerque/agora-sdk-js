import { describe, expect, it } from 'vitest';
import { AgoraClient } from '../src';

function response(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

describe('resource helpers', () => {
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

  it('approval aliases route through decide', async () => {
    const calls: string[] = [];
    const fetchMock: typeof fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      calls.push(`${init?.method}:${url}`);
      return response({ ok: true, data: { id: 'ap-1', status: 'approved' } });
    };

    const client = new AgoraClient({ baseUrl: 'https://instance.example.com', fetch: fetchMock });
    const result = await client.approvals.approve('ap-1');

    expect(result.status).toBe('approved');
    expect(calls[0]).toContain('/v1/approvals/ap-1/decision');
  });

  it('waitForCompletion polls execution until terminal status', async () => {
    let reads = 0;
    const fetchMock: typeof fetch = async () => {
      reads += 1;
      return response({ ok: true, data: { id: 'exec-1', status: reads > 1 ? 'completed' : 'running' } });
    };

    const client = new AgoraClient({ baseUrl: 'https://instance.example.com', fetch: fetchMock });
    const execution = await client.executions.waitForCompletion('exec-1', { intervalMs: 1, timeoutMs: 100 });

    expect(execution.status).toBe('completed');
    expect(reads).toBe(2);
  });

  it('supports inbox lead conversion helpers', async () => {
    const calls: string[] = [];
    const fetchMock: typeof fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      calls.push(`${init?.method}:${url}`);
      return response({ ok: true, data: { leadId: 'lead-1' } });
    };

    const client = new AgoraClient({ baseUrl: 'https://instance.example.com', fetch: fetchMock });
    await client.inbox.previewLeadConversion('item-1');
    await client.inbox.convertLead('item-1');
    await client.leads.convertFromInbox('item-1');

    expect(calls[0]).toContain('/api/v1/inbox/item-1/convert-lead/preview');
    expect(calls[1]).toContain('/api/v1/inbox/item-1/convert-lead');
    expect(calls[2]).toContain('/api/v1/inbox/item-1/convert-lead');
  });
});