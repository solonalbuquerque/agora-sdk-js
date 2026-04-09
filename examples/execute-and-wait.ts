import { createHmacClient, isDirectRun, printSection, requireEnv } from './_shared';

export async function main(): Promise<void> {
  const client = createHmacClient();
  const result = await client.flows.executeService({
    actorId: requireEnv('AGORA_AGENT_ID'),
    serviceCode: requireEnv('AGORA_SERVICE_CODE'),
    input: {
      prompt: 'Execute and wait for terminal status.',
      requestedAt: new Date().toISOString(),
    },
    autoRequestApproval: false,
    wait: true,
    polling: {
      intervalMs: 1_500,
      timeoutMs: 90_000,
    },
  });

  printSection('Execute And Wait Result', result);
}

if (isDirectRun(import.meta.url)) {
  void main();
}