import type { CreateInboxItemInput, Dictionary, InboxItem, RequestOptions, WorkflowRun } from '../types';
import { toArrayResult, unwrapData } from '../core/utils';
import { BaseResource } from './base';

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

  async previewLeadConversion(itemId: string, body: Dictionary = {}, options?: RequestOptions): Promise<Dictionary> {
    return unwrapData(await this.http.post(`/api/v1/inbox/${itemId}/convert-lead/preview`, body, options));
  }

  async convertLead(itemId: string, body: Dictionary = {}, options?: RequestOptions): Promise<Dictionary> {
    return unwrapData(await this.http.post(`/api/v1/inbox/${itemId}/convert-lead`, body, options));
  }

  async listAvailableWorkflows(itemId: string, options?: RequestOptions): Promise<Dictionary[]> {
    return toArrayResult(await this.http.get(`/api/v1/inbox/${itemId}/available-workflows`, options));
  }

  async listWorkflowRuns(itemId: string, options?: RequestOptions): Promise<WorkflowRun[]> {
    return toArrayResult(await this.http.get(`/api/v1/inbox/${itemId}/workflow-runs`, options));
  }
}