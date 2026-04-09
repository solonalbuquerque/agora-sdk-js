import type {
  Agent,
  Approval,
  ApprovalDecisionInput,
  ApprovalRequestInput,
  AuthModesInfo,
  Capability,
  CreateInboxItemInput,
  Dictionary,
  Employer,
  Execution,
  ExecutionPreflight,
  ExecutionPreflightInput,
  InboxItem,
  InstanceInfo,
  InstanceManifest,
  Lead,
  PaginatedResult,
  RegisterAgentInput,
  RegisterAgentResult,
  RequestOptions,
  ServiceExecutionInput,
  ServiceSummary,
  Task,
  VerifyAgentKeyInput,
  VerifiedAgentKey,
  WalletBalance,
  WalletTransfer,
  WalletTransferInput,
  WorkflowRun,
} from './types';
import { HttpClient } from './core/http';
import { toArrayResult, unwrapData } from './core/utils';

class BaseResource {
  constructor(protected readonly http: HttpClient) {}
}

export class InstanceResource extends BaseResource {
  async getManifest(options?: RequestOptions): Promise<InstanceManifest> {
    return unwrapData(await this.http.get('/.well-known/agora.json', options));
  }

  async getInfo(options?: RequestOptions): Promise<InstanceInfo> {
    return unwrapData(await this.http.get('/api/info', options));
  }
}

export class AuthResource extends BaseResource {
  async getModes(options?: RequestOptions): Promise<AuthModesInfo> {
    return unwrapData(await this.http.get('/v1/auth/modes', options));
  }
}

export class CapabilitiesResource extends BaseResource {
  async list(options?: RequestOptions): Promise<Capability[]> {
    return toArrayResult(await this.http.get('/v1/capabilities', options));
  }
}

export class AgentsResource extends BaseResource {
  async register(input: RegisterAgentInput, options?: RequestOptions): Promise<RegisterAgentResult> {
    const payload = {
      name: input.name,
      ...(input.registrationKey ? { registration_key: input.registrationKey } : {}),
    };
    const data = unwrapData<Record<string, unknown>>(await this.http.post('/agents/register', payload, options));
    return {
      id: String(data.id),
      name: data.name as string | undefined,
      challengeId: String(data.challenge_id),
      challenge: String(data.challenge),
      expiresAt: data.expires_at as string | undefined,
      verifyKeyEndpoint: data.verify_key_endpoint as string | undefined,
      recommendedKeyFormat: data.recommended_key_format as string | undefined,
      instructions: data.instructions as string | undefined,
    };
  }

  async verifyKey(input: VerifyAgentKeyInput, options?: RequestOptions): Promise<VerifiedAgentKey> {
    return unwrapData(
      await this.http.post('/agents/verify-key', {
        agent_id: input.agentId,
        challenge_id: input.challengeId,
        public_key: input.publicKey,
        signature: input.signature,
      }, options),
    );
  }

  async me(options?: RequestOptions): Promise<Agent> {
    return unwrapData(await this.http.get('/agents/me', options));
  }

  async createDelegation(id: string, body: Dictionary, options?: RequestOptions): Promise<Dictionary> {
    return unwrapData(await this.http.post(`/agents/${id}/delegate`, body, options));
  }

  async listDelegations(id: string, options?: RequestOptions): Promise<Dictionary[]> {
    return toArrayResult(await this.http.get(`/agents/${id}/delegations`, options));
  }
}

export class ServicesResource extends BaseResource {
  async list(query?: Record<string, string | number | boolean | null | undefined>, options?: RequestOptions): Promise<ServiceSummary[]> {
    return toArrayResult(await this.http.get('/api/services/', { ...options, query }));
  }

  async get(serviceCode: string, options?: RequestOptions): Promise<ServiceSummary> {
    return unwrapData(await this.http.get(`/api/services/${serviceCode}`, options));
  }

  async execute(id: string, input: ServiceExecutionInput, options?: RequestOptions): Promise<Execution> {
    const payload = {
      actorId: input.actorId,
      serviceCode: input.serviceCode,
      input: input.input,
      approvalMode: input.approvalMode,
      budgetLimitAgo: input.budgetLimitAgo,
      correlationId: input.correlationId,
      idempotencyKey: input.idempotencyKey,
      workflowContext: input.workflowContext,
      callbackUrl: input.callbackUrl,
      callbackSecret: input.callbackSecret,
      requestedExecutionMode: input.requestedExecutionMode,
    };
    return unwrapData(await this.http.post(`/v1/services/${id}/execute`, payload, options));
  }

  async preflight(input: ExecutionPreflightInput, options?: RequestOptions): Promise<ExecutionPreflight> {
    return unwrapData(await this.http.post('/api/external/preflight', input, options));
  }
}

export class ExecutionsResource extends BaseResource {
  async list(query?: Record<string, string | number | boolean | null | undefined>, options?: RequestOptions): Promise<Execution[]> {
    return toArrayResult(await this.http.get('/v1/executions', { ...options, query }));
  }

  async get(id: string, options?: RequestOptions): Promise<Execution> {
    return unwrapData(await this.http.get(`/v1/executions/${id}`, options));
  }

  async create(input: ServiceExecutionInput, options?: RequestOptions): Promise<Execution> {
    return unwrapData(await this.http.post('/api/external/executions', input, options));
  }

  async getApproval(executionId: string, options?: RequestOptions): Promise<Approval> {
    return unwrapData(await this.http.get(`/api/external/executions/${executionId}/approval`, options));
  }
}

export class WorkflowsResource extends BaseResource {
  async run(id: string, input: Dictionary = {}, options?: RequestOptions): Promise<WorkflowRun> {
    return unwrapData(await this.http.post(`/v1/workflows/${id}/run`, input, options));
  }

  async list(options?: RequestOptions): Promise<Dictionary[]> {
    return toArrayResult(await this.http.get('/workflows', options));
  }

  async get(id: string, options?: RequestOptions): Promise<Dictionary> {
    return unwrapData(await this.http.get(`/workflows/${id}`, options));
  }
}

export class InboxResource extends BaseResource {
  async create(input: CreateInboxItemInput, options?: RequestOptions): Promise<InboxItem> {
    return unwrapData(await this.http.post('/v1/inbox', input, options));
  }

  async ingestAndRun(input: CreateInboxItemInput, options?: RequestOptions): Promise<InboxItem> {
    return unwrapData(await this.http.post('/v1/inbox/ingest-and-run', input, options));
  }

  async list(query?: Record<string, string | number | boolean | null | undefined>, options?: RequestOptions): Promise<InboxItem[]> {
    return toArrayResult(await this.http.get('/api/v1/inbox', { ...options, query }));
  }

  async get(itemId: string, options?: RequestOptions): Promise<InboxItem> {
    return unwrapData(await this.http.get(`/api/v1/inbox/${itemId}`, options));
  }

  async update(itemId: string, body: Dictionary, options?: RequestOptions): Promise<InboxItem> {
    return unwrapData(await this.http.patch(`/api/v1/inbox/${itemId}`, body, options));
  }

  async run(itemId: string, body: Dictionary = {}, options?: RequestOptions): Promise<WorkflowRun> {
    return unwrapData(await this.http.post(`/api/v1/inbox/${itemId}/run`, body, options));
  }

  async listAvailableWorkflows(itemId: string, options?: RequestOptions): Promise<Dictionary[]> {
    return toArrayResult(await this.http.get(`/api/v1/inbox/${itemId}/available-workflows`, options));
  }

  async listWorkflowRuns(itemId: string, options?: RequestOptions): Promise<WorkflowRun[]> {
    return toArrayResult(await this.http.get(`/api/v1/inbox/${itemId}/workflow-runs`, options));
  }
}

export class WalletResource extends BaseResource {
  async getBalance(options?: RequestOptions): Promise<WalletBalance> {
    return unwrapData(await this.http.get('/api/v1/wallet/balance', options));
  }

  async listDeposits(query?: Record<string, string | number | boolean | null | undefined>, options?: RequestOptions): Promise<Dictionary[]> {
    return toArrayResult(await this.http.get('/api/v1/wallet/deposits', { ...options, query }));
  }

  async createDeposit(body: Dictionary, options?: RequestOptions): Promise<Dictionary> {
    return unwrapData(await this.http.post('/api/v1/wallet/deposits', body, options));
  }

  async listWithdrawals(query?: Record<string, string | number | boolean | null | undefined>, options?: RequestOptions): Promise<Dictionary[]> {
    return toArrayResult(await this.http.get('/api/v1/wallet/withdrawals', { ...options, query }));
  }

  async createWithdrawal(body: Dictionary, options?: RequestOptions): Promise<Dictionary> {
    return unwrapData(await this.http.post('/api/v1/wallet/withdrawals', body, options));
  }

  async getLedger(query?: Record<string, string | number | boolean | null | undefined>, options?: RequestOptions): Promise<Dictionary[]> {
    return toArrayResult(await this.http.get('/api/v1/wallet/ledger', { ...options, query }));
  }

  async transfer(input: WalletTransferInput, options?: RequestOptions): Promise<WalletTransfer> {
    return unwrapData(await this.http.post('/v1/wallet/transfers', {
      toAgentId: input.toAgentId,
      toWalletId: input.toWalletId,
      amount: input.amount,
      currency: input.currency,
      memo: input.memo,
      idempotencyKey: input.idempotencyKey,
    }, options));
  }
}

export class ApprovalsResource extends BaseResource {
  async list(query?: Record<string, string | number | boolean | null | undefined>, options?: RequestOptions): Promise<Approval[]> {
    return toArrayResult(await this.http.get('/api/external/approvals', { ...options, query }));
  }

  async get(id: string, options?: RequestOptions): Promise<Approval> {
    return unwrapData(await this.http.get(`/api/external/approvals/${id}`, options));
  }

  async request(input: ApprovalRequestInput, options?: RequestOptions): Promise<Approval> {
    return unwrapData(await this.http.post('/api/external/approvals/request', {
      actorId: input.actorId,
      serviceCode: input.serviceCode,
      input: input.input,
      callbackUrl: input.callbackUrl,
      callbackSecret: input.callbackSecret,
      amountAgoCents: input.amountAgoCents,
      agentMessage: input.agentMessage,
      correlationId: input.correlationId,
      workflowContext: input.workflowContext,
    }, options));
  }

  async decide(id: string, input: ApprovalDecisionInput, options?: RequestOptions): Promise<Approval> {
    return unwrapData(await this.http.post(`/v1/approvals/${id}/decision`, {
      decision: input.decision,
      decision_payload_json: input.decisionPayload,
    }, options));
  }
}

export class EmployersResource extends BaseResource {
  async list(query?: Record<string, string | number | boolean | null | undefined>, options?: RequestOptions): Promise<Employer[]> {
    return toArrayResult(await this.http.get('/api/v1/employers', { ...options, query }));
  }

  async get(id: string, options?: RequestOptions): Promise<Employer> {
    return unwrapData(await this.http.get(`/api/v1/employers/${id}`, options));
  }

  async listTasks(id: string, query?: Record<string, string | number | boolean | null | undefined>, options?: RequestOptions): Promise<Task[]> {
    return toArrayResult(await this.http.get(`/api/v1/employers/${id}/tasks`, { ...options, query }));
  }

  async createTask(id: string, body: Dictionary, options?: RequestOptions): Promise<Task> {
    return unwrapData(await this.http.post(`/api/v1/employers/${id}/tasks`, body, options));
  }

  async listApprovals(id: string, query?: Record<string, string | number | boolean | null | undefined>, options?: RequestOptions): Promise<Approval[]> {
    return toArrayResult(await this.http.get(`/api/v1/employers/${id}/approvals`, { ...options, query }));
  }

  async listLeads(id: string, query?: Record<string, string | number | boolean | null | undefined>, options?: RequestOptions): Promise<Lead[]> {
    return toArrayResult(await this.http.get(`/api/v1/employers/${id}/leads`, { ...options, query }));
  }

  async createLead(id: string, body: Dictionary, options?: RequestOptions): Promise<Lead> {
    return unwrapData(await this.http.post(`/api/v1/employers/${id}/leads`, body, options));
  }

  async updateInboxConfig(id: string, body: Dictionary, options?: RequestOptions): Promise<Dictionary> {
    return unwrapData(await this.http.put(`/api/v1/employers/${id}/inbox/config`, body, options));
  }
}

export class LeadsResource extends BaseResource {
  async list(query?: Record<string, string | number | boolean | null | undefined>, options?: RequestOptions): Promise<Lead[]> {
    return toArrayResult(await this.http.get('/api/v1/leads', { ...options, query }));
  }

  async get(id: string, options?: RequestOptions): Promise<Lead> {
    return unwrapData(await this.http.get(`/api/v1/leads/${id}`, options));
  }
}

export class WebhooksResource extends BaseResource {
  async list(options?: RequestOptions): Promise<Dictionary[]> {
    return toArrayResult(await this.http.get('/v1/webhooks', options));
  }

  async listDeliveries(id: string, options?: RequestOptions): Promise<Dictionary[]> {
    return toArrayResult(await this.http.get(`/v1/webhooks/${id}/deliveries`, options));
  }

  async redeliver(id: string, eventId: string, options?: RequestOptions): Promise<Dictionary> {
    return unwrapData(await this.http.post(`/v1/webhooks/${id}/redeliver`, { eventId }, options));
  }
}