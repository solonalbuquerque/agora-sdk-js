import { fileURLToPath } from 'node:url';
import {
  AgoraClient,
  createApiKeyAuth,
  createHmacAuth,
  createJwtAuth,
  type FlowResult,
  type HumanActionRequest,
} from '../src/index';

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function optionalEnv(name: string): string | undefined {
  return process.env[name] || undefined;
}

export function createApiKeyClient(): AgoraClient {
  return new AgoraClient({
    baseUrl: requireEnv('AGORA_BASE_URL'),
    auth: createApiKeyAuth({ apiKey: requireEnv('AGORA_API_KEY') }),
  });
}

export function createHmacClient(): AgoraClient {
  return new AgoraClient({
    baseUrl: requireEnv('AGORA_BASE_URL'),
    auth: createHmacAuth({
      agentId: requireEnv('AGORA_AGENT_ID'),
      secret: requireEnv('AGORA_AGENT_SECRET'),
    }),
  });
}

export function createJwtClient(): AgoraClient {
  return new AgoraClient({
    baseUrl: requireEnv('AGORA_BASE_URL'),
    auth: createJwtAuth({ token: requireEnv('AGORA_JWT') }),
  });
}

export function printSection(title: string, value: unknown): void {
  console.log(`\n=== ${title} ===`);
  console.log(JSON.stringify(value, null, 2));
}

export function printPendingAction(action: HumanActionRequest): void {
  printSection('Pending Action', {
    type: action.type,
    message: action.message,
    instructions: action.instructions,
    context: action.context,
    resumeToken: action.resumeToken,
    recommendedPolling: action.recommendedPolling,
  });
}

export function assertFlowOk<T>(result: FlowResult<T>): T {
  if (!result.ok || !result.data) {
    throw new Error(`Expected successful flow result, received: ${JSON.stringify(result, null, 2)}`);
  }
  return result.data;
}

export function isDirectRun(metaUrl: string): boolean {
  const entry = process.argv[1];
  return Boolean(entry) && fileURLToPath(metaUrl) === entry;
}