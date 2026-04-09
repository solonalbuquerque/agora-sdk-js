import type { InstanceInfo, InstanceManifest, RequestOptions } from '../types';
import { unwrapData } from '../core/utils';
import { BaseResource } from './base';

export class InstanceResource extends BaseResource {
  async getManifest(options?: RequestOptions): Promise<InstanceManifest> {
    return unwrapData(await this.http.get('/.well-known/agora.json', options));
  }

  async getInfo(options?: RequestOptions): Promise<InstanceInfo> {
    return unwrapData(await this.http.get('/api/info', options));
  }
}