import type { Dictionary, RequestOptions } from '../types';
import { toArrayResult, unwrapData } from '../core/utils';
import { BaseResource } from './base';

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