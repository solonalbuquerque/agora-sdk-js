import type {
  Capability,
  CapabilityExecutionInput,
  CapabilityPreflightInput,
  CapabilityQuote,
  CapabilitySummary,
  Execution,
  ExecutionPreflight,
  RequestOptions,
} from '../types';
import { toArrayResult, unwrapData } from '../core/utils';
import { BaseResource } from './base';

function resolveCapabilityCode(input: { capabilityCode?: string; serviceCode?: string }): string {
  return String(input.capabilityCode ?? input.serviceCode ?? '');
}

function normalizeCapabilitySummary(capability: CapabilitySummary): CapabilitySummary {
  const capabilityCode = String(capability.capabilityCode ?? capability.serviceCode ?? capability.code ?? capability.id ?? '');
  return capabilityCode ? { ...capability, capabilityCode } : capability;
}

function normalizeCapability(capability: Capability): Capability {
  const capabilityCode = String(capability.capabilityCode ?? capability.serviceCode ?? capability.code ?? capability.id ?? '');
  return capabilityCode ? { ...capability, capabilityCode } : capability;
}

function normalizeExecution(execution: Execution): Execution {
  const capabilityCode = String(execution.capabilityCode ?? execution.serviceCode ?? '');
  return capabilityCode ? { ...execution, capabilityCode } : execution;
}

export class CapabilitiesResource extends BaseResource {
  async discover(options?: RequestOptions): Promise<Capability[]> {
    return toArrayResult<Capability>(await this.http.get('/v1/capabilities', options)).map(normalizeCapability);
  }

  async list(query?: Record<string, string | number | boolean | null | undefined>, options?: RequestOptions): Promise<CapabilitySummary[]> {
    return toArrayResult<CapabilitySummary>(await this.http.get('/api/services/', { ...options, query })).map(normalizeCapabilitySummary);
  }

  async get(capabilityCode: string, options?: RequestOptions): Promise<CapabilitySummary>;
  /**
   * @deprecated Use discover() for capability discovery or get(capabilityCode) for a specific capability.
   */
  async get(options?: RequestOptions): Promise<Capability[]>;
  async get(capabilityCodeOrOptions?: string | RequestOptions, options?: RequestOptions): Promise<CapabilitySummary | Capability[]> {
    if (typeof capabilityCodeOrOptions !== 'string') {
      return this.discover(capabilityCodeOrOptions);
    }
    return normalizeCapabilitySummary(unwrapData(await this.http.get(`/api/services/${capabilityCodeOrOptions}`, options)));
  }

  async quote(input: CapabilityPreflightInput, options?: RequestOptions): Promise<CapabilityQuote> {
    return unwrapData(await this.http.post('/quote', {
      actorId: input.actorId,
      serviceCode: resolveCapabilityCode(input),
      input: input.input,
      correlationId: input.correlationId,
      workflowContext: input.workflowContext,
    }, options));
  }

  async execute(id: string, input: CapabilityExecutionInput, options?: RequestOptions): Promise<Execution> {
    const payload = {
      actorId: input.actorId,
      serviceCode: resolveCapabilityCode(input),
      input: input.input,
      approvalMode: input.approvalMode,
      budgetLimitAgo: input.budgetLimitAgo,
      correlationId: input.correlationId,
      idempotencyKey: input.idempotencyKey,
      workflowContext: input.workflowContext,
      callbackUrl: input.callbackUrl,
      callbackSecret: input.callbackSecret,
      requestedExecutionMode: input.requestedExecutionMode,
    };
    return normalizeExecution(unwrapData(await this.http.post(`/v1/services/${id}/execute`, payload, options)));
  }

  async preflight(input: CapabilityPreflightInput, options?: RequestOptions): Promise<ExecutionPreflight> {
    return unwrapData(await this.http.post('/api/external/preflight', {
      actorId: input.actorId,
      serviceCode: resolveCapabilityCode(input),
      input: input.input,
      approvalMode: input.approvalMode,
      budgetLimitAgo: input.budgetLimitAgo,
      correlationId: input.correlationId,
      workflowContext: input.workflowContext,
    }, options));
  }
}
