import type { Dictionary, Lead, RequestOptions } from '../types';
import { toArrayResult, unwrapData } from '../core/utils';
import { BaseResource } from './base';

export class LeadsResource extends BaseResource {
  async list(query?: Record<string, string | number | boolean | null | undefined>, options?: RequestOptions): Promise<Lead[]> {
    return toArrayResult(await this.http.get('/api/v1/leads', { ...options, query }));
  }

  async get(id: string, options?: RequestOptions): Promise<Lead> {
    return unwrapData(await this.http.get(`/api/v1/leads/${id}`, options));
  }

  async convertFromInbox(itemId: string, body: Dictionary = {}, options?: RequestOptions): Promise<Dictionary> {
    return unwrapData(await this.http.post(`/api/v1/inbox/${itemId}/convert-lead`, body, options));
  }
}