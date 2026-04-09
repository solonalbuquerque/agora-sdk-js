import type { Approval, Dictionary, Employer, Lead, RequestOptions, Task } from '../types';
import { toArrayResult, unwrapData } from '../core/utils';
import { BaseResource } from './base';

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