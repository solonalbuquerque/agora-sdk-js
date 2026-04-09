import { describe, expect, it } from 'vitest';
import { AgoraClient, createApiKeyAuth } from '../src';

function response(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
  });
}

describe('AgoraFlows', () => {
  it('returns approval_required action when preflight demands approval', async () => {
    const fetchMock: typeof fetch = async (input) => {
      const url = String(input);
      if (url.endsWith('/api/external/preflight')) {
        return response({ ok: true, data: { allowed: true, requiresApproval: true, estimatedCostCents: 2500 } });
      }
      throw new Error(`Unexpected fetch ${url}`);
    };

    const client = new AgoraClient({
      baseUrl: 'https://instance.example.com',
      auth: createApiKeyAuth({ apiKey: 'dev-key' }),
      fetch: fetchMock,
    });

    const result = await client.flows.executeService({
      serviceCode: 'svc.echo',
      input: { hello: 'world' },
    });

    expect(result.ok).toBe(false);
    expect(result.nextAction?.type).toBe('approval_required');
    expect(result.nextAction?.resumeToken.kind).toBe('approval-required');
  });

  it('creates and waits for execution when preflight is clear', async () => {
    let executionReads = 0;
    const fetchMock: typeof fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (url.endsWith('/api/external/preflight')) {
        return response({ ok: true, data: { allowed: true, requiresApproval: false, budgetSufficient: true } });
      }
      if (url.endsWith('/api/external/executions') && init?.method === 'POST') {
        return response({ ok: true, data: { id: 'exec-1', status: 'pending' } });
      }
      if (url.endsWith('/v1/executions/exec-1')) {
        executionReads += 1;
        return response({ ok: true, data: { id: 'exec-1', status: executionReads > 1 ? 'completed' : 'running' } });
      }
      throw new Error(`Unexpected fetch ${url}`);
    };

    const client = new AgoraClient({ baseUrl: 'https://instance.example.com', fetch: fetchMock });
    const result = await client.flows.executeService({ serviceCode: 'svc.echo', wait: true });

    expect(result.ok).toBe(true);
    expect(result.data?.execution?.status).toBe('completed');
  });
});