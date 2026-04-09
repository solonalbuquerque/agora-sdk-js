import type { Approval, Execution, PollingOptions, RequestOptions } from '../types';
import { poll, toArrayResult, unwrapData } from '../core/utils';
import { BaseResource } from './base';

export class ExecutionsResource extends BaseResource {
  async list(query?: Record<string, string | number | boolean | null | undefined>, options?: RequestOptions): Promise<Execution[]> {
    return toArrayResult(await this.http.get('/v1/executions', { ...options, query }));
  }

  async get(id: string, options?: RequestOptions): Promise<Execution> {
    return unwrapData(await this.http.get(`/v1/executions/${id}`, options));
  }

  async create(input: Record<string, unknown>, options?: RequestOptions): Promise<Execution> {
    return unwrapData(await this.http.post('/api/external/executions', input, options));
  }

  async cancel(executionId: string, options?: RequestOptions): Promise<Execution> {
    return unwrapData(await this.http.post(`/api/external/executions/${executionId}/cancel`, {}, options));
  }

  async getApproval(executionId: string, options?: RequestOptions): Promise<Approval> {
    return unwrapData(await this.http.get(`/api/external/executions/${executionId}/approval`, options));
  }

  async waitForCompletion(executionId: string, options?: PollingOptions): Promise<Execution> {
    return poll(
      () => this.get(executionId),
      (execution) => isTerminalStatus(execution.status),
      options,
    );
  }
}

function isTerminalStatus(status: string | undefined): boolean {
  if (!status) return false;
  return ['completed', 'succeeded', 'success', 'failed', 'rejected', 'denied', 'cancelled', 'canceled', 'expired'].includes(status.toLowerCase());
}