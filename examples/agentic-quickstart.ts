import { createHmacClient, isDirectRun, printSection } from './_shared';

export async function main(): Promise<void> {
  const client = createHmacClient();
  const capabilities = await client.capabilities.discover();
  printSection('Capabilities', capabilities);

  const result = await client.flows.executeCapability({
    actorId: process.env.AGORA_AGENT_ID,
    capabilityCode: process.env.AGORA_CAPABILITY_CODE || process.env.AGORA_SERVICE_CODE || 'svc.echo',
    input: { message: 'hello from AI' },
    autoRequestApproval: true,
  });

  printSection('Capability Flow Result', result);
}

if (isDirectRun(import.meta.url)) {
  void main();
}
