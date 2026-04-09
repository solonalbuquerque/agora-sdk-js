import type { AuthModesInfo, RequestOptions } from '../types';
import { unwrapData } from '../core/utils';
import { BaseResource } from './base';

export class AuthResource extends BaseResource {
  async getModes(options?: RequestOptions): Promise<AuthModesInfo> {
    return unwrapData(await this.http.get('/v1/auth/modes', options));
  }
}