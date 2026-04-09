import type {
  Agent,
  Approval,
  ApprovalRequestSummary,
  ExecuteServiceFlowInput,
  Execution,
  FlowResult,
  HumanLinkRequestContext,
  HumanLinkStartInput,
  OnboardAgentInput,
  OnboardAgentResult,
  PollingOptions,
  ResumeToken,
  RunWorkflowFromInboxInput,
  TransferFundsFlowInput,
  WalletTransfer,
  WorkflowRun,
} from './types';
import { ensureIdempotencyKey, poll } from './core/utils';
import type { AgoraClient } from './client';

function approvalSummary(approval: Approval): ApprovalRequestSummary {
  return {
    approvalId: String(approval.approvalId ?? approval.id),
    status: approval.status,
    amountAgoCents: approval.amount_ago_cents,
    expiresAt: approval.expires_at ?? null,
  };
}

export class AgoraFlows {
  constructor(private readonly client: AgoraClient) {}

  async onboardAgent(input: OnboardAgentInput): Promise<FlowResult<OnboardAgentResult>> {
    const registration = await this.client.agents.register({
      name: input.name,
      registrationKey: input.registrationKey,
    });
    const signature = await input.signChallenge(registration.challenge);
    const verification = await this.client.agents.verifyKey({
      agentId: registration.id,
      challengeId: registration.challengeId,
      publicKey: input.publicKey,
      signature,
    });
    const agent: Agent = {
      id: registration.id,
      name: registration.name,
    };
    return {
      ok: true,
      data: { agent, verification },
      meta: { route: '/agents/register -> /agents/verify-key' },
    };
  }

  async startHumanLink(input: HumanLinkStartInput): Promise<FlowResult<never>> {
    const challenge = await this.client.http.post<{ ok?: boolean; data?: { nonce: string } }>('/human/link-challenge', {
      agent_id: input.agentId,
    });
    const nonce = String(challenge.data?.nonce ?? '');
    const signature = await input.signNonce(nonce);
    const context: HumanLinkRequestContext = {
      agentId: input.agentId,
      nonce,
      signature,
    };
    const resumeToken: ResumeToken<'human-link', HumanLinkRequestContext> = {
      kind: 'human-link',
      createdAt: new Date().toISOString(),
      context,
    };
    return {
      ok: false,
      nextAction: {
        type: 'human_link_required',
        message: 'A human must complete agent linking/ownership confirmation.',
        instructions: [
          'Present the nonce and agent signature to the authenticated human flow.',
          'Call POST /human/link-agent with agent_id, nonce, and agent_signature once a human is ready to confirm ownership.',
          'Resume the SDK flow with the returned resume token after the link completes.',
        ],
        context,
        resumeToken,
      },
      meta: { route: '/human/link-challenge' },
    };
  }

  async executeService(input: ExecuteServiceFlowInput): Promise<FlowResult<{ execution?: Execution; approval?: ApprovalRequestSummary }>> {
    const idempotencyKey = ensureIdempotencyKey(input.idempotencyKey);
    const preflight = await this.client.services.preflight({
      actorId: input.actorId,
      serviceCode: input.serviceCode,
      input: input.input,
      approvalMode: input.approvalMode,
      budgetLimitAgo: input.budgetLimitAgo,
      correlationId: input.correlationId,
      workflowContext: input.workflowContext,
    });

    if (!preflight.allowed) {
      return {
        ok: false,
        nextAction: {
          type: preflight.budgetSufficient === false ? 'insufficient_funds' : 'approval_required',
          message: preflight.reason ?? 'Execution preflight requires additional action.',
          instructions: [
            'Inspect the preflight payload to decide whether to request approval or fund the wallet.',
            'Do not execute the service until the pending requirement is satisfied.',
          ],
          context: {
            serviceCode: input.serviceCode,
            preflight,
          },
          resumeToken: {
            kind: 'execution-preflight',
            createdAt: new Date().toISOString(),
            context: {
              serviceCode: input.serviceCode,
              preflight,
              originalInput: input as unknown as Record<string, unknown>,
            },
          },
        },
        meta: { idempotencyKey, route: '/api/external/preflight' },
      };
    }

    if (preflight.requiresApproval) {
      if (!input.autoRequestApproval) {
        return {
          ok: false,
          nextAction: {
            type: 'approval_required',
            message: 'Execution requires human approval before side effects can continue.',
            instructions: [
              'Create an approval request or surface this requirement to a human approver.',
              'Resume execution once the approval is approved.',
            ],
            context: {
              serviceCode: input.serviceCode,
              preflight,
            },
            resumeToken: {
              kind: 'approval-required',
              createdAt: new Date().toISOString(),
              context: {
                serviceCode: input.serviceCode,
                originalInput: input as unknown as Record<string, unknown>,
              },
            },
            recommendedPolling: input.polling ? { intervalMs: input.polling.intervalMs ?? 1000, timeoutMs: input.polling.timeoutMs } : undefined,
          },
          meta: { idempotencyKey, route: '/api/external/preflight' },
        };
      }

      const approval = await this.client.approvals.request({
        actorId: input.actorId,
        serviceCode: input.serviceCode,
        input: input.input,
        callbackUrl: input.callbackUrl,
        callbackSecret: input.callbackSecret,
        amountAgoCents: preflight.estimatedCostCents,
        correlationId: input.correlationId,
        workflowContext: input.workflowContext,
      });

      return {
        ok: false,
        nextAction: {
          type: 'approval_required',
          message: 'Approval has been requested. Wait for a human decision before resuming execution.',
          instructions: [
            'Surface the approval details to a human approver.',
            'Resume the flow after the approval status changes to approved.',
          ],
          context: {
            approvalId: String(approval.approvalId ?? approval.id),
            preflight,
          },
          resumeToken: {
            kind: 'approval-requested',
            createdAt: new Date().toISOString(),
            context: {
              approvalId: String(approval.approvalId ?? approval.id),
              originalInput: input as unknown as Record<string, unknown>,
            },
          },
          recommendedPolling: { intervalMs: input.polling?.intervalMs ?? 1_000, timeoutMs: input.polling?.timeoutMs ?? 60_000 },
        },
        meta: { idempotencyKey, route: '/api/external/approvals/request' },
      };
    }

    const execution = await this.client.executions.create({ ...input, idempotencyKey }, { idempotencyKey });
    if (!input.wait) {
      return {
        ok: true,
        data: { execution },
        meta: { idempotencyKey, route: '/api/external/executions' },
      };
    }

    const executionId = String(execution.executionId ?? execution.id ?? '');
    const settled = await this.waitForExecution(executionId, input.polling);
    return {
      ok: true,
      data: { execution: settled },
      meta: { idempotencyKey, route: '/v1/executions/{id}' },
    };
  }

  async requestApproval(input: ExecuteServiceFlowInput): Promise<FlowResult<ApprovalRequestSummary>> {
    const preflight = await this.client.services.preflight(input);
    const approval = await this.client.approvals.request({
      actorId: input.actorId,
      serviceCode: input.serviceCode,
      input: input.input,
      callbackUrl: input.callbackUrl,
      callbackSecret: input.callbackSecret,
      amountAgoCents: preflight.estimatedCostCents,
      correlationId: input.correlationId,
      workflowContext: input.workflowContext,
      agentMessage: preflight.reason ?? 'Approval requested by AI flow.',
    });
    return {
      ok: true,
      data: approvalSummary(approval),
      meta: { route: '/api/external/approvals/request' },
    };
  }

  async transferFunds(input: TransferFundsFlowInput): Promise<FlowResult<WalletTransfer>> {
    const idempotencyKey = ensureIdempotencyKey(input.idempotencyKey);
    const transfer = await this.client.wallet.transfer({ ...input, idempotencyKey }, { idempotencyKey });
    return {
      ok: true,
      data: transfer,
      meta: { idempotencyKey, route: '/v1/wallet/transfers' },
    };
  }

  async runWorkflowFromInbox(input: RunWorkflowFromInboxInput): Promise<FlowResult<{ inbox: unknown; workflowRun?: WorkflowRun }>> {
    const inbox = input.createInbox
      ? (input.runOther ? await this.client.inbox.ingestAndRun(input.createInbox) : await this.client.inbox.create(input.createInbox))
      : await this.client.inbox.get(String(input.inboxItemId));

    if (input.runOther && input.workflowId && (inbox.id ?? inbox.itemId)) {
      const workflowRun = await this.client.inbox.run(String(inbox.id ?? inbox.itemId), { workflowId: input.workflowId });
      if (input.wait) {
        const runId = String(workflowRun.runUuid ?? workflowRun.id ?? '');
        const settled = await this.waitForWorkflowRun(String(inbox.id ?? inbox.itemId), runId, input.polling);
        return { ok: true, data: { inbox, workflowRun: settled }, meta: { route: '/api/v1/inbox/{itemId}/workflow-runs/{runUuid}' } };
      }
      return { ok: true, data: { inbox, workflowRun }, meta: { route: '/api/v1/inbox/{itemId}/run' } };
    }

    return { ok: true, data: { inbox }, meta: { route: '/v1/inbox' } };
  }

  async waitForExecution(executionId: string, options?: PollingOptions): Promise<Execution> {
    return poll(
      () => this.client.executions.get(executionId),
      (execution) => isTerminalStatus(execution.status),
      options,
    );
  }

  async waitForApprovalDecision(approvalId: string, options?: PollingOptions): Promise<Approval> {
    return poll(
      () => this.client.approvals.get(approvalId),
      (approval) => isTerminalStatus(approval.status),
      options,
    );
  }

  async waitForWorkflowRun(itemId: string, runUuid: string, options?: PollingOptions): Promise<WorkflowRun> {
    return poll(
      async () => {
        const runs = await this.client.inbox.listWorkflowRuns(itemId);
        return runs.find((run) => String(run.runUuid ?? run.id) === runUuid) ?? { runUuid, status: 'unknown' };
      },
      (run) => isTerminalStatus(run.status),
      options,
    );
  }

  async resume(token: ResumeToken): Promise<FlowResult<unknown>> {
    switch (token.kind) {
      case 'approval-requested': {
        const approvalId = String((token.context as Record<string, unknown>).approvalId);
        const approval = await this.waitForApprovalDecision(approvalId);
        return {
          ok: true,
          data: approvalSummary(approval),
          meta: { route: '/api/external/approvals/{approvalId}' },
        };
      }
      case 'human-link': {
        return {
          ok: false,
          nextAction: {
            type: 'human_link_required',
            message: 'Human link still requires explicit completion via /human/link-agent.',
            instructions: [
              'Submit the stored nonce and signature to POST /human/link-agent inside an authenticated human session.',
              'Issue a new resume call after the link endpoint succeeds.',
            ],
            context: token.context,
            resumeToken: token,
          },
        };
      }
      default:
        return {
          ok: false,
          nextAction: {
            type: 'awaiting_execution',
            message: `Resume token kind '${token.kind}' is not auto-resumable yet.`,
            instructions: ['Use the low-level resources with token.context to continue the flow explicitly.'],
            context: token.context,
            resumeToken: token,
          },
        };
    }
  }
}

function isTerminalStatus(status: string | undefined): boolean {
  if (!status) return false;
  return ['completed', 'succeeded', 'success', 'failed', 'rejected', 'denied', 'cancelled', 'canceled', 'approved', 'expired'].includes(status.toLowerCase());
}