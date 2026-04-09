import { createApiKeyClient, isDirectRun, printSection, requireEnv } from './_shared';

export async function main(): Promise<void> {
  const client = createApiKeyClient();

  const result = await client.flows.runWorkflowFromInbox({
    createInbox: {
      department_id: requireEnv('AGORA_DEPARTMENT_ID'),
      type: process.env.AGORA_INBOX_TYPE || 'lead',
      title: process.env.AGORA_INBOX_TITLE || 'SDK example inbox item',
      contact: {
        name: process.env.AGORA_CONTACT_NAME || 'Example Contact',
        email: process.env.AGORA_CONTACT_EMAIL || 'contact@example.com',
        phone: process.env.AGORA_CONTACT_PHONE || '+5500000000000',
      },
      data: {
        source: 'sdk-example',
        requestedAt: new Date().toISOString(),
      },
    },
    workflowId: requireEnv('AGORA_WORKFLOW_ID'),
    runOther: true,
    wait: true,
    polling: {
      intervalMs: 2_000,
      timeoutMs: 120_000,
    },
  });

  printSection('Inbox Workflow Result', result);
}

if (isDirectRun(import.meta.url)) {
  void main();
}