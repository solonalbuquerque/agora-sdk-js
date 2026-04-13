# agora-sdk-js

Official JavaScript / TypeScript SDK for AGORA Instance.

`agora-sdk-js` is a standalone, publishable SDK for AGORA Instance. It is Node-first, TypeScript-first, fetch-based, and designed to feel like a real developer product instead of a thin HTTP wrapper.

The SDK covers AGORA Instance domains such as auth handling, agents, wallet, capabilities, executions, inbox, leads, workflows, approvals, employers, and webhook utilities. It intentionally excludes AGORA CENTRAL-only treasury, registry, and global-settlement product flows.

## Install

```bash
npm install agora-sdk-js
```

## Quick Start

```ts
import { AgoraClient, createApiKeyAuth } from 'agora-sdk-js';

const client = new AgoraClient({
  baseUrl: 'https://instance.example.com',
  auth: createApiKeyAuth({ apiKey: process.env.AGORA_API_KEY! }),
});

const balance = await client.wallet.getBalance();
const capabilities = await client.capabilities.discover();
```

## Auth Examples

### API key

```ts
import { AgoraClient, createApiKeyAuth } from 'agora-sdk-js';

const client = new AgoraClient({
  baseUrl: process.env.AGORA_BASE_URL!,
  auth: createApiKeyAuth({ apiKey: process.env.AGORA_API_KEY! }),
});
```

### HMAC agent auth

```ts
import { AgoraClient, createHmacAuth } from 'agora-sdk-js';

const client = new AgoraClient({
  baseUrl: process.env.AGORA_BASE_URL!,
  auth: createHmacAuth({
    agentId: process.env.AGORA_AGENT_ID!,
    secret: process.env.AGORA_AGENT_SECRET!,
  }),
});
```

### Bearer token

```ts
import { AgoraClient, createJwtAuth } from 'agora-sdk-js';

const client = new AgoraClient({
  baseUrl: process.env.AGORA_BASE_URL!,
  auth: createJwtAuth({ token: process.env.AGORA_JWT! }),
});
```

## Common Resource Usage

### Execute a capability

```ts
const execution = await client.capabilities.execute('svc.echo', {
  actorId: process.env.AGORA_AGENT_ID,
  capabilityCode: 'svc.echo',
  input: { prompt: 'hello' },
  idempotencyKey: 'exec-123',
});
```

### Create an inbox item

```ts
const inboxItem = await client.inbox.create({
  department_id: 'dept-123',
  type: 'lead',
  title: 'New contact',
  data: { source: 'site-form' },
});
```

### Run a workflow

```ts
const workflowRun = await client.workflows.run('workflow-123', {
  trigger: 'manual',
  input: { leadId: 'lead-123' },
});
```

### Get wallet balance and ledger

```ts
const [balance, ledger] = await Promise.all([
  client.wallet.getBalance(),
  client.wallet.getStatement(),
]);
```

### Approve or reject an approval

```ts
await client.approvals.approve('approval-123');
await client.approvals.reject('approval-456', { reason: 'Budget denied' });
```

## AI-Usable Flows

### Onboard an agent

```ts
import { signEd25519Challenge } from 'agora-sdk-js';

const result = await client.flows.onboardAgent({
  name: 'Support Agent',
  publicKey: process.env.AGORA_PUBLIC_KEY!,
  signChallenge: (challenge) => signEd25519Challenge(process.env.AGORA_PRIVATE_KEY!, challenge),
});
```

### Safe capability execution with approval handling

```ts
const result = await client.flows.executeCapability({
  actorId: process.env.AGORA_AGENT_ID,
  capabilityCode: 'svc.echo',
  input: { prompt: 'hello' },
  autoRequestApproval: true,
  wait: true,
});

if (!result.ok && result.nextAction) {
  console.log(result.nextAction.type);
  console.log(result.nextAction.instructions);
}
```

### Poll for completion

```ts
const execution = await client.executions.waitForCompletion('exec-123', {
  intervalMs: 1500,
  timeoutMs: 60000,
});
```

## Capability Migration

`capabilities` is the canonical public product surface.

Deprecated compatibility aliases remain available:
- `client.services`
- `ServiceSummary`, `ServiceQuote`, `ServiceExecutionInput`
- `ExecuteServiceFlowInput`
- `client.flows.executeService()`
- `serviceCode` request fields

When both `capabilityCode` and `serviceCode` are provided, the SDK uses `capabilityCode`.

## Error Handling

```ts
import {
  AgoraApiError,
  AgoraAuthError,
  AgoraIdempotencyConflictError,
  AgoraValidationError,
} from 'agora-sdk-js';

try {
  await client.wallet.transfer({
    toAgentId: 'agent-456',
    amount: 100,
    idempotencyKey: 'transfer-123',
  });
} catch (error) {
  if (error instanceof AgoraAuthError) {
    console.error('Auth failed', error.status, error.code);
  } else if (error instanceof AgoraValidationError) {
    console.error('Validation failed', error.details);
  } else if (error instanceof AgoraIdempotencyConflictError) {
    console.error('Duplicate request', error.requestId);
  } else if (error instanceof AgoraApiError) {
    console.error('API failure', error.status, error.code, error.details);
  } else {
    throw error;
  }
}
```

## Idempotency

Relevant write operations accept explicit `idempotencyKey` values. The SDK only auto-generates idempotency keys in guided flows where it is intentionally orchestrating side-effectful operations.

```ts
await client.wallet.transfer({
  toAgentId: 'agent-456',
  amount: 100,
  idempotencyKey: 'wallet-transfer-001',
});
```

## Public Client Surface

- `client.instance`
- `client.auth`
- `client.agents`
- `client.capabilities`
- `client.executions`
- `client.workflows`
- `client.inbox`
- `client.wallet`
- `client.approvals`
- `client.employers`
- `client.leads`
- `client.webhooks`
- `client.flows`

Deprecated alias:
- `client.services`

## Current Coverage Notes

Implemented because the Instance API supports them cleanly:
- `agents.register`, `agents.verifyKey`, `agents.rotateKey`, `agents.me`
- `wallet.getBalance`, `wallet.getStatement`, `wallet.getLedger`, `wallet.transfer`
- `capabilities.discover`, `capabilities.list`, `capabilities.get`, `capabilities.quote`, `capabilities.execute`, `capabilities.preflight`
- `executions.list`, `executions.get`, `executions.cancel`, `executions.waitForCompletion`
- `inbox.create`, `inbox.ingestAndRun`, `inbox.get`, `inbox.list`, lead conversion helpers
- `workflows.list`, `workflows.get`, `workflows.run`
- `approvals.list`, `approvals.get`, `approvals.request`, `approvals.decide`, `approvals.approve`, `approvals.reject`

Explicitly omitted for now because the provided spec does not expose a stable external route:
- `agents.get(id)`
- `agents.list()`
- `workflows.cancel()`
- `capabilities.create()`

## Wallet Semantics

`client.wallet.transfer()` targets the canonical instance route `/v1/wallet/transfers`.

`balance`, `deposits`, `withdrawals`, and `ledger` are exposed because they are part of the Instance API surface, but the current API contract describes some of them as instance projections derived from external settlement authority. The SDK keeps those operations available while preserving that distinction in documentation.

## Examples

See `examples/` for practical scenarios:
- discovery and auth
- onboarding an agent
- human-link handoff
- safe capability execution
- approval request and resume
- execute and wait
- transfer funds
- inbox workflow run

## Development

```bash
npm install
npm run check
npm run test
npm run build
```

## Release Readiness

- ESM and CommonJS outputs via `tsup`
- generated `.d.ts`
- source maps enabled
- npm-ready exports in `package.json`
- standalone package with no internal monorepo dependency

See `CHANGELOG.md` for release-note structure.
