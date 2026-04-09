import type { Capability, RequestOptions } from '../types';
import { toArrayResult } from '../core/utils';
import { BaseResource } from './base';

export class CapabilitiesResource extends BaseResource {
  async list(options?: RequestOptions): Promise<Capability[]> {
    return toArrayResult(await this.http.get('/v1/capabilities', options));
  }

  async get(options?: RequestOptions): Promise<Capability[]> {
    return this.list(options);
  }
}