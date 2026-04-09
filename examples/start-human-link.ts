import { createHmac } from 'node:crypto';
import { createApiKeyClient, isDirectRun, printPendingAction, printSection, requireEnv } from './_shared';

function signNonce(nonce: string): string {
  const secret = requireEnv('AGORA_AGENT_SECRET');
  return createHmac('sha256', secret).update(nonce).digest('hex');
}

export async function main(): Promise<void> {
  const client = createApiKeyClient();
  const result = await client.flows.startHumanLink({
    agentId: requireEnv('AGORA_AGENT_ID'),
    signNonce,
  });

  if (!result.ok && result.nextAction) {
    printPendingAction(result.nextAction);
    printSection('Serialized Resume Token', JSON.stringify(result.nextAction.resumeToken));

    const resumed = await client.flows.resume(result.nextAction.resumeToken);
    printSection('Resume Attempt', resumed);
    return;
  }

  printSection('Unexpected Result', result);
}

if (isDirectRun(import.meta.url)) {
  void main();
}