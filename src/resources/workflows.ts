import type { Dictionary, RequestOptions, WorkflowRun } from '../types';
import { toArrayResult, unwrapData } from '../core/utils';
import { BaseResource } from './base';

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