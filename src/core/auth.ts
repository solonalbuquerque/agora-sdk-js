import { createHmac, createPrivateKey, sign as signWithPrivateKey } from 'node:crypto';
import type {
  ApiKeyAuthConfig,
  AuthProvider,
  Ed25519AuthConfig,
  HmacAuthConfig,
  JwtAuthConfig,
  RequestContext,
} from '../types';
import { AgoraAuthError } from './errors';

async function resolveValue(value: string | (() => string | Promise<string>)): Promise<string> {
  return typeof value === 'function' ? await value() : value;
}

function bodyDigest(body: RequestContext['body']): string {
  return body === undefined ? '' : JSON.stringify(body);
}

function assertNonEmptyString(value: string | Uint8Array, label: string): void {
  if (typeof value === 'string' && value.trim().length === 0) {
    throw new AgoraAuthError(`${label} must not be empty`);
  }
  if (value instanceof Uint8Array && value.length === 0) {
    throw new AgoraAuthError(`${label} must not be empty`);
  }
}

function decodeKeyMaterial(value: string | Uint8Array): Buffer {
  if (value instanceof Uint8Array) return Buffer.from(value);
  return Buffer.from(value);
}

export class JwtAuthProvider implements AuthProvider {
  readonly mode = 'jwt' as const;
  constructor(private readonly config: JwtAuthConfig) {
    if (typeof config.token === 'string' && config.token.trim().length === 0) {
      throw new AgoraAuthError('JWT token must not be empty');
    }
  }

  async apply(context: RequestContext): Promise<void> {
    const token = await resolveValue(this.config.token);
    if (!token || token.trim().length === 0) throw new AgoraAuthError('JWT token must not be empty');
    context.headers.set('Authorization', `Bearer ${token}`);
  }
}

export class ApiKeyAuthProvider implements AuthProvider {
  readonly mode = 'apiKey' as const;
  constructor(private readonly config: ApiKeyAuthConfig) {
    if (typeof config.apiKey === 'string' && config.apiKey.trim().length === 0) {
      throw new AgoraAuthError('API key must not be empty');
    }
  }

  async apply(context: RequestContext): Promise<void> {
    const apiKey = await resolveValue(this.config.apiKey);
    if (!apiKey || apiKey.trim().length === 0) throw new AgoraAuthError('API key must not be empty');
    const headerName = this.config.headerName ?? 'X-API-KEY';
    const prefix = this.config.prefix ? `${this.config.prefix} ` : '';
    context.headers.set(headerName, `${prefix}${apiKey}`);
  }
}

export class HmacAuthProvider implements AuthProvider {
  readonly mode = 'hmac' as const;
  constructor(private readonly config: HmacAuthConfig) {
    if (!config.agentId || config.agentId.trim().length === 0) throw new AgoraAuthError('HMAC agentId must not be empty');
    assertNonEmptyString(config.secret, 'HMAC secret');
  }

  apply(context: RequestContext): void {
    const timestampHeader = this.config.timestampHeader ?? 'X-Timestamp';
    const agentIdHeader = this.config.agentIdHeader ?? 'X-Agent-Id';
    const signatureHeader = this.config.signatureHeader ?? 'X-Signature';
    const timestamp = new Date().toISOString();
    const body = bodyDigest(context.body);
    const message = [context.method, context.url.pathname, context.url.search, timestamp, body].join('\n');
    const secret = this.config.secret instanceof Uint8Array ? Buffer.from(this.config.secret) : this.config.secret;
    const signature = createHmac('sha256', secret).update(message).digest('hex');
    context.headers.set(agentIdHeader, this.config.agentId);
    context.headers.set(timestampHeader, timestamp);
    context.headers.set(signatureHeader, signature);
  }
}

export class Ed25519AuthProvider implements AuthProvider {
  readonly mode = 'ed25519' as const;
  constructor(private readonly config: Ed25519AuthConfig) {
    assertNonEmptyString(config.privateKey, 'Ed25519 private key');
    normalizePrivateKey(config.privateKey);
  }

  apply(context: RequestContext): void {
    const timestampHeader = this.config.timestampHeader ?? 'x-agora-timestamp';
    const signatureHeader = this.config.signatureHeader ?? 'x-agora-signature';
    const keyIdHeader = this.config.keyIdHeader ?? 'x-agora-kid';
    const instanceIdHeader = this.config.instanceIdHeader ?? 'x-agora-instance-id';
    const timestamp = new Date().toISOString();
    const message = [context.method, context.url.pathname, context.url.search, timestamp, bodyDigest(context.body)].join('\n');
    const privateKey = normalizePrivateKey(this.config.privateKey);
    const signature = signWithPrivateKey(null, Buffer.from(message), privateKey).toString('base64');
    context.headers.set(timestampHeader, timestamp);
    context.headers.set(signatureHeader, signature);
    if (this.config.keyId) context.headers.set(keyIdHeader, this.config.keyId);
    if (this.config.instanceId) context.headers.set(instanceIdHeader, this.config.instanceId);
  }
}

function normalizePrivateKey(value: string | Uint8Array) {
  try {
    return createPrivateKey(value instanceof Uint8Array ? Buffer.from(value) : value);
  } catch {
    try {
      return createPrivateKey({ key: decodeKeyMaterial(value), format: 'pem' });
    } catch (error) {
      throw new AgoraAuthError('Invalid Ed25519 private key material', { cause: error });
    }
  }
}

export function createJwtAuth(config: JwtAuthConfig): JwtAuthProvider {
  return new JwtAuthProvider(config);
}

export function createApiKeyAuth(config: ApiKeyAuthConfig): ApiKeyAuthProvider {
  return new ApiKeyAuthProvider(config);
}

export function createHmacAuth(config: HmacAuthConfig): HmacAuthProvider {
  return new HmacAuthProvider(config);
}

export function createEd25519Auth(config: Ed25519AuthConfig): Ed25519AuthProvider {
  return new Ed25519AuthProvider(config);
}

export async function signEd25519Challenge(privateKey: string | Uint8Array, challenge: string): Promise<string> {
  const key = normalizePrivateKey(privateKey);
  return signWithPrivateKey(null, Buffer.from(challenge), key).toString('hex');
}