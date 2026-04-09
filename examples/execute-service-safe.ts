import { createHmacClient, isDirectRun, printPendingAction, printSection, requireEnv } from './_shared';

export async function main(): Promise<void> {
  const client = createHmacClient();

  const result = await client.flows.executeService({
    actorId: requireEnv('AGORA_AGENT_ID'),
    serviceCode: requireEnv('AGORA_SERVICE_CODE'),
    input: {
      prompt: 'Run a safe preflight-only execution example.',
      requestedAt: new Date().toISOString(),
    },
    autoRequestApproval: false,
  });

  if (!result.ok && result.nextAction) {
    printPendingAction(result.nextAction);
    return;
  }

  printSection('Execution Submitted Without Additional Action', result);
}

if (isDirectRun(import.meta.url)) {
  void main();
}