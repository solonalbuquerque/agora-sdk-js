import type { Approval, ApprovalDecisionInput, ApprovalRequestInput, RequestOptions } from '../types';
import { toArrayResult, unwrapData } from '../core/utils';
import { BaseResource } from './base';

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

  async approve(id: string, decisionPayload?: ApprovalDecisionInput['decisionPayload'], options?: RequestOptions): Promise<Approval> {
    return this.decide(id, { decision: 'approve', decisionPayload }, options);
  }

  async reject(id: string, decisionPayload?: ApprovalDecisionInput['decisionPayload'], options?: RequestOptions): Promise<Approval> {
    return this.decide(id, { decision: 'reject', decisionPayload }, options);
  }
}