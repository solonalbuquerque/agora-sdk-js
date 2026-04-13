import type {
  Execution,
  ExecutionPreflight,
  ExecutionPreflightInput,
  RequestOptions,
  ServiceExecutionInput,
  ServiceQuote,
  ServiceSummary,
} from '../types';
import { HttpClient } from '../core/http';
import { BaseResource } from './base';
import { CapabilitiesResource } from './capabilities';

/**
 * @deprecated Use CapabilitiesResource instead.
 */
export class ServicesResource extends BaseResource {
  private readonly capabilities: CapabilitiesResource;

  constructor(http: HttpClient) {
    super(http);
    this.capabilities = new CapabilitiesResource(http);
  }

  async list(query?: Record<string, string | number | boolean | null | undefined>, options?: RequestOptions): Promise<ServiceSummary[]> {
    return this.capabilities.list(query, options) as Promise<ServiceSummary[]>;
  }

  async get(serviceCode: string, options?: RequestOptions): Promise<ServiceSummary> {
    return this.capabilities.get(serviceCode, options) as Promise<ServiceSummary>;
  }

  async quote(input: ExecutionPreflightInput, options?: RequestOptions): Promise<ServiceQuote> {
    return this.capabilities.quote(input, options) as Promise<ServiceQuote>;
  }

  async execute(id: string, input: ServiceExecutionInput, options?: RequestOptions): Promise<Execution> {
    return this.capabilities.execute(id, input, options);
  }

  async preflight(input: ExecutionPreflightInput, options?: RequestOptions): Promise<ExecutionPreflight> {
    return this.capabilities.preflight(input, options);
  }
}
