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

    const result = await client.flows.executeCapability({
      capabilityCode: 'svc.echo',
      input: { hello: 'world' },
    });

    expect(result.ok).toBe(false);
    expect(result.nextAction?.type).toBe('approval_required');
    expect(result.nextAction?.resumeToken.kind).toBe('approval-required');
    expect((result.nextAction?.context as Record<string, unknown>).capabilityCode).toBe('svc.echo');
  });

  it('creates and waits for execution when preflight is clear', async () => {
    let executionReads = 0;
    const fetchMock: typeof fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (url.endsWith('/api/external/preflight')) {
        return response({ ok: true, data: { allowed: true, requiresApproval: false, budgetSufficient: true } });
      }
      if (url.endsWith('/api/external/executions') && init?.method === 'POST') {
        return response({ ok: true, data: { id: 'exec-1', status: 'pending', serviceCode: 'svc.echo' } });
      }
      if (url.endsWith('/v1/executions/exec-1')) {
        executionReads += 1;
        return response({ ok: true, data: { id: 'exec-1', status: executionReads > 1 ? 'completed' : 'running', serviceCode: 'svc.echo' } });
      }
      throw new Error(`Unexpected fetch ${url}`);
    };

    const client = new AgoraClient({ baseUrl: 'https://instance.example.com', fetch: fetchMock });
    const result = await client.flows.executeCapability({ capabilityCode: 'svc.echo', wait: true });

    expect(result.ok).toBe(true);
    expect(result.data?.execution?.status).toBe('completed');
    expect(result.data?.execution?.capabilityCode).toBe('svc.echo');
  });

  it('keeps executeService as a deprecated alias', async () => {
    const calls: string[] = [];
    const fetchMock: typeof fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      calls.push(`${init?.method}:${url}:${init?.body ? String(init.body) : ''}`);
      if (url.endsWith('/api/external/preflight')) {
        return response({ ok: true, data: { allowed: true, requiresApproval: false, budgetSufficient: true } });
      }
      if (url.endsWith('/api/external/executions') && init?.method === 'POST') {
        return response({ ok: true, data: { id: 'exec-2', status: 'pending' } });
      }
      throw new Error(`Unexpected fetch ${url}`);
    };

    const client = new AgoraClient({ baseUrl: 'https://instance.example.com', fetch: fetchMock });
    const result = await client.flows.executeService({ serviceCode: 'svc.echo' });

    expect(result.ok).toBe(true);
    expect(calls.some((call) => call.includes('"serviceCode":"svc.echo"'))).toBe(true);
  });

  it('prefers capabilityCode over serviceCode when both are provided', async () => {
    const bodies: string[] = [];
    const fetchMock: typeof fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (init?.body) bodies.push(String(init.body));
      if (url.endsWith('/api/external/preflight')) {
        return response({ ok: true, data: { allowed: true, requiresApproval: false, budgetSufficient: true } });
      }
      if (url.endsWith('/api/external/executions') && init?.method === 'POST') {
        return response({ ok: true, data: { id: 'exec-3', status: 'pending' } });
      }
      throw new Error(`Unexpected fetch ${url}`);
    };

    const client = new AgoraClient({ baseUrl: 'https://instance.example.com', fetch: fetchMock });
    await client.flows.executeCapability({ capabilityCode: 'cap.primary', serviceCode: 'svc.legacy' });

    expect(bodies[0]).toContain('"serviceCode":"cap.primary"');
    expect(bodies[1]).toContain('"serviceCode":"cap.primary"');
  });
});
