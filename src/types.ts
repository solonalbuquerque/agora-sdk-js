export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export interface JsonObject {
  [key: string]: JsonValue | undefined;
}

export type Dictionary<T = unknown> = Record<string, T>;
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type AuthMode = 'none' | 'hmac' | 'ed25519' | 'jwt' | 'apiKey';

export interface AgoraClientOptions {
  baseUrl: string;
  auth?: AuthProvider;
  fetch?: typeof fetch;
  timeoutMs?: number;
  retry?: RetryPolicy;
  headers?: Record<string, string>;
  userAgent?: string;
}

export interface RetryPolicy {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  retryOnStatuses?: number[];
}

export interface RequestOptions {
  query?: Record<string, string | number | boolean | null | undefined>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
  auth?: AuthProvider;
  idempotencyKey?: string;
  responseType?: 'json' | 'text' | 'raw';
}

export interface RequestContext {
  method: HttpMethod;
  path: string;
  url: URL;
  body?: JsonValue | undefined;
  headers: Headers;
  options: RequestOptions;
  authModeHint?: AuthMode | undefined;
}

export interface AuthProvider {
  readonly mode: AuthMode;
  apply(context: RequestContext): Promise<void> | void;
}

export interface JwtAuthConfig {
  token: string | (() => string | Promise<string>);
}

export interface ApiKeyAuthConfig {
  apiKey: string | (() => string | Promise<string>);
  headerName?: string;
  prefix?: string;
}

export interface HmacAuthConfig {
  agentId: string;
  secret: string | Uint8Array;
  timestampHeader?: string;
  agentIdHeader?: string;
  signatureHeader?: string;
  algorithm?: 'sha256';
}

export interface Ed25519AuthConfig {
  keyId?: string;
  privateKey: string | Uint8Array;
  instanceId?: string;
  instanceIdHeader?: string;
  keyIdHeader?: string;
  timestampHeader?: string;
  signatureHeader?: string;
}

export interface AgoraResponseEnvelope<T> {
  ok?: boolean;
  data?: T;
  code?: string;
  message?: string;
  [key: string]: unknown;
}

export interface PaginatedResult<T> {
  rows: T[];
  total?: number;
  limit?: number;
  offset?: number;
}

export interface InstanceManifest {
  protocol?: string;
  protocol_version?: string;
  instance_id?: string | null;
  base_url?: string;
  instance_status?: string;
  export_services_enabled?: boolean;
  reserved_coin_policy?: Dictionary;
  docs?: Dictionary<string>;
  endpoints?: Dictionary<string>;
}

export interface InstanceInfo {
  docs?: Dictionary<string>;
  system?: Dictionary;
  auth_summary?: Dictionary<string>;
}

export interface AuthModesInfo {
  modes?: Array<{ mode: AuthMode | string; description?: string }>;
  endpointFamilies?: Dictionary<string[]>;
  [key: string]: unknown;
}

export interface Capability {
  id?: string;
  code?: string;
  name?: string;
  category?: string;
  description?: string;
  [key: string]: unknown;
}

export interface Agent {
  id: string;
  name?: string;
  status?: string;
  trust_level?: number;
  trust_level_name?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface RegisterAgentInput {
  name: string;
  registrationKey?: string;
}

export interface RegisterAgentResult {
  id: string;
  name?: string;
  challengeId: string;
  challenge: string;
  expiresAt?: string;
  verifyKeyEndpoint?: string;
  recommendedKeyFormat?: string;
  instructions?: string;
}

export interface VerifyAgentKeyInput {
  agentId: string;
  challengeId: string;
  publicKey: string;
  signature: string;
}

export interface VerifiedAgentKey {
  agent_id?: string;
  auth_type?: string;
  fingerprint?: string;
  [key: string]: unknown;
}

export interface ServiceSummary {
  id?: string;
  code?: string;
  serviceCode?: string;
  name?: string;
  category?: string;
  price?: number;
  status?: string;
  [key: string]: unknown;
}

export interface ExecutionPreflightInput {
  actorId?: string;
  serviceCode: string;
  input?: JsonObject;
  approvalMode?: 'auto' | 'require' | 'skip';
  budgetLimitAgo?: number;
  correlationId?: string;
  workflowContext?: WorkflowContext;
}

export interface ExecutionPreflight {
  allowed: boolean;
  reason?: string | null;
  requiresApproval?: boolean;
  estimatedCostCents?: number;
  budgetSufficient?: boolean;
  availableCents?: number;
  routeRecommendation?: string;
  [key: string]: unknown;
}

export interface ServiceExecutionInput extends ExecutionPreflightInput {
  idempotencyKey?: string;
  callbackUrl?: string;
  callbackSecret?: string;
  requestedExecutionMode?: string;
}

export interface Execution {
  id?: string;
  executionId?: string;
  status?: string;
  serviceCode?: string;
  result?: unknown;
  error?: unknown;
  approvalId?: string;
  [key: string]: unknown;
}

export interface WorkflowContext {
  workflowId?: string;
  executionId?: string;
  nodeId?: string;
  [key: string]: unknown;
}

export interface WorkflowRun {
  id?: string;
  runUuid?: string;
  status?: string;
  workflowId?: string;
  [key: string]: unknown;
}

export interface InboxItem {
  id?: string;
  itemId?: string;
  department_id?: string;
  type?: string;
  title?: string;
  status?: string;
  contact?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  data?: JsonObject;
  [key: string]: unknown;
}

export interface CreateInboxItemInput {
  department_id: string;
  type?: string;
  title?: string;
  contact?: InboxItem['contact'];
  data?: JsonObject;
}

export interface Approval {
  id?: string;
  approvalId?: string;
  status?: string;
  amount_ago_cents?: number;
  expires_at?: string | null;
  [key: string]: unknown;
}

export interface ApprovalDecisionInput {
  decision: 'approve' | 'deny' | 'reject';
  decisionPayload?: JsonObject;
}

export interface ApprovalRequestInput {
  actorId?: string;
  serviceCode: string;
  input?: JsonObject;
  callbackUrl?: string;
  callbackSecret?: string;
  amountAgoCents?: number;
  agentMessage?: string;
  correlationId?: string;
  workflowContext?: WorkflowContext;
}

export interface WalletBalance {
  available?: number;
  reserved?: number;
  currency?: string;
  [key: string]: unknown;
}

export interface WalletTransferInput {
  toAgentId?: string;
  toWalletId?: string;
  amount: number;
  currency?: string;
  memo?: string;
  idempotencyKey?: string;
}

export interface WalletTransfer {
  id?: string;
  status?: string;
  amount?: number;
  currency?: string;
  [key: string]: unknown;
}

export interface Employer {
  id: string;
  name?: string;
  status?: string;
  [key: string]: unknown;
}

export interface Lead {
  id?: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: string;
  [key: string]: unknown;
}

export interface Task {
  id?: string;
  taskId?: string;
  status?: string;
  job_id?: string;
  [key: string]: unknown;
}

export type FlowPendingActionType =
  | 'human_link_required'
  | 'approval_required'
  | 'insufficient_funds'
  | 'awaiting_execution'
  | 'awaiting_workflow_run'
  | 'awaiting_approval_decision';

export interface RecommendedPolling {
  intervalMs: number;
  timeoutMs?: number;
}

export interface ResumeToken<TKind extends string = string, TContext = Dictionary> {
  kind: TKind;
  createdAt: string;
  context: TContext;
}

export interface HumanActionRequest<TContext = Dictionary> {
  type: FlowPendingActionType;
  message: string;
  instructions: string[];
  context: TContext;
  resumeToken: ResumeToken<string, TContext>;
  recommendedPolling?: RecommendedPolling;
}

export interface FlowResult<T> {
  ok: boolean;
  data?: T;
  nextAction?: HumanActionRequest;
  meta?: {
    idempotencyKey?: string;
    route?: string;
  };
}

export interface OnboardAgentInput extends RegisterAgentInput {
  publicKey: string;
  signChallenge: (challenge: string) => Promise<string> | string;
}

export interface OnboardAgentResult {
  agent: Agent;
  verification: VerifiedAgentKey;
}

export interface HumanLinkStartInput {
  agentId: string;
  signNonce: (nonce: string) => Promise<string> | string;
}

export interface HumanLinkRequestContext extends Dictionary {
  agentId: string;
  nonce: string;
  signature: string;
}

export interface ExecuteServiceFlowInput extends ServiceExecutionInput {
  autoRequestApproval?: boolean;
  wait?: boolean;
  polling?: PollingOptions;
}

export interface ApprovalRequestSummary {
  approvalId: string;
  status?: string;
  amountAgoCents?: number;
  expiresAt?: string | null;
}

export interface ExecutionOutcome {
  execution?: Execution;
  preflight?: ExecutionPreflight;
  approval?: ApprovalRequestSummary;
}

export interface TransferFundsFlowInput extends WalletTransferInput {
  wait?: boolean;
}

export interface RunWorkflowFromInboxInput {
  inboxItemId?: string;
  createInbox?: CreateInboxItemInput;
  workflowId?: string;
  runOther?: boolean;
  wait?: boolean;
  polling?: PollingOptions;
}

export interface PollingOptions {
  intervalMs?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
}