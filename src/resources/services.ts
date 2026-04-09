import type {
  Execution,
  ExecutionPreflight,
  ExecutionPreflightInput,
  RequestOptions,
  ServiceExecutionInput,
  ServiceQuote,
  ServiceSummary,
} from '../types';
import { toArrayResult, unwrapData } from '../core/utils';
import { BaseResource } from './base';

export class ServicesResource extends BaseResource {
  async list(query?: Record<string, string | number | boolean | null | undefined>, options?: RequestOptions): Promise<ServiceSummary[]> {
    return toArrayResult(await this.http.get('/api/services/', { ...options, query }));
  }

  async get(serviceCode: string, options?: RequestOptions): Promise<ServiceSummary> {
    return unwrapData(await this.http.get(`/api/services/${serviceCode}`, options));
  }

  async quote(input: ExecutionPreflightInput, options?: RequestOptions): Promise<ServiceQuote> {
    return unwrapData(await this.http.post('/quote', {
      actorId: input.actorId,
      serviceCode: input.serviceCode,
      input: input.input,
      correlationId: input.correlationId,
      workflowContext: input.workflowContext,
    }, options));
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