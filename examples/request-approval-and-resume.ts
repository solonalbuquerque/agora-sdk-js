import type { ExecuteServiceFlowInput } from '../src/index';
import { createHmacClient, isDirectRun, printPendingAction, printSection, requireEnv } from './_shared';

export async function main(): Promise<void> {
  const client = createHmacClient();
  const request: ExecuteServiceFlowInput = {
    actorId: requireEnv('AGORA_AGENT_ID'),
    serviceCode: requireEnv('AGORA_SERVICE_CODE'),
    input: {
      prompt: 'Request approval and resume the flow after a human decision.',
      requestedAt: new Date().toISOString(),
    },
    polling: {
      intervalMs: 2_000,
      timeoutMs: 120_000,
    },
  };

  const approval = await client.flows.requestApproval(request);
  printSection('Approval Request', approval);

  if (!approval.ok || !approval.data) {
    throw new Error('Expected approval request to succeed.');
  }

  const decided = await client.flows.waitForApprovalDecision(approval.data.approvalId, request.polling);
  printSection('Approval Decision', decided);

  const resumeResult = await client.flows.resume({
    kind: 'approval-requested',
    createdAt: new Date().toISOString(),
    context: {
      approvalId: approval.data.approvalId,
      originalInput: request as Record<string, unknown>,
    },
  });
  printSection('Resume Result', resumeResult);

  if (String(decided.status).toLowerCase() === 'approved') {
    const execution = await client.flows.executeService({
      ...request,
      autoRequestApproval: false,
      wait: true,
    });
    printSection('Execution After Approval', execution);
    return;
  }

  printPendingAction({
    type: 'approval_required',
    message: 'Approval was not granted, so execution will not continue.',
    instructions: ['Inspect the approval decision and either retry later or ask for a new approval.'],
    context: { approvalId: approval.data.approvalId, status: decided.status },
    resumeToken: {
      kind: 'approval-requested',
      createdAt: new Date().toISOString(),
      context: { approvalId: approval.data.approvalId },
    },
  });
}

if (isDirectRun(import.meta.url)) {
  void main();
}