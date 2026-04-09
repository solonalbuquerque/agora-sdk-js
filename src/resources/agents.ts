import type {
  Agent,
  Dictionary,
  RegisterAgentInput,
  RegisterAgentResult,
  RequestOptions,
  RotateAgentKeyResult,
  VerifyAgentKeyInput,
  VerifiedAgentKey,
} from '../types';
import { toArrayResult, unwrapData } from '../core/utils';
import { BaseResource } from './base';

export class AgentsResource extends BaseResource {
  async register(input: RegisterAgentInput, options?: RequestOptions): Promise<RegisterAgentResult> {
    const payload = {
      name: input.name,
      ...(input.registrationKey ? { registration_key: input.registrationKey } : {}),
    };
    const data = unwrapData<Record<string, unknown>>(await this.http.post('/agents/register', payload, options));
    return {
      id: String(data.id),
      name: data.name as string | undefined,
      challengeId: String(data.challenge_id),
      challenge: String(data.challenge),
      expiresAt: data.expires_at as string | undefined,
      verifyKeyEndpoint: data.verify_key_endpoint as string | undefined,
      recommendedKeyFormat: data.recommended_key_format as string | undefined,
      instructions: data.instructions as string | undefined,
    };
  }

  async verifyKey(input: VerifyAgentKeyInput, options?: RequestOptions): Promise<VerifiedAgentKey> {
    return unwrapData(
      await this.http.post('/agents/verify-key', {
        agent_id: input.agentId,
        challenge_id: input.challengeId,
        public_key: input.publicKey,
        signature: input.signature,
      }, options),
    );
  }

  async rotateKey(options?: RequestOptions): Promise<RotateAgentKeyResult> {
    return unwrapData(await this.http.post('/agents/rotate-key', {}, options));
  }

  async me(options?: RequestOptions): Promise<Agent> {
    return unwrapData(await this.http.get('/agents/me', options));
  }

  async createDelegation(id: string, body: Dictionary, options?: RequestOptions): Promise<Dictionary> {
    return unwrapData(await this.http.post(`/agents/${id}/delegate`, body, options));
  }

  async listDelegations(id: string, options?: RequestOptions): Promise<Dictionary[]> {
    return toArrayResult(await this.http.get(`/agents/${id}/delegations`, options));
  }
}