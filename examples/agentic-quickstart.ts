import { createHmacClient, isDirectRun, printSection } from './_shared';

export async function main(): Promise<void> {
  const client = createHmacClient();
  const capabilities = await client.capabilities.list();
  printSection('Capabilities', capabilities);

  const result = await client.flows.executeService({
    actorId: process.env.AGORA_AGENT_ID,
    serviceCode: process.env.AGORA_SERVICE_CODE || 'svc.echo',
    input: { message: 'hello from AI' },
    autoRequestApproval: true,
  });

  printSection('Execution Flow Result', result);
}

if (isDirectRun(import.meta.url)) {
  void main();
}