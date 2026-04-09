# agora-sdk-js

Official JavaScript / TypeScript SDK for AGORA Instance.

This SDK is Node-first, TypeScript-first, and AI-usable by default. It provides:

- a typed resource client for AGORA Instance domains
- guided flows for autonomous agents
- auth helpers for HMAC, Ed25519, JWT, and API key modes
- resumable human handoff semantics for approvals and linking
- polling helpers for asynchronous execution lifecycle tracking

## Status

First implementation scaffold for AGORA Instance v1 based on the provided OpenAPI contract. The SDK intentionally excludes CENTRAL-only product surfaces from the public API.

## Install

```bash
npm install agora-sdk-js
```

## Quick Start

```ts
import { AgoraClient, createApiKeyAuth } from 'agora-sdk-js';

const client = new AgoraClient({
  baseUrl: 'https://instance-dev.theagora.center',
  auth: createApiKeyAuth({ apiKey: process.env.AGORA_API_KEY! }),
});

const balance = await client.wallet.getBalance();
const capabilities = await client.capabilities.list();
```

## AI-Usable Flows

### Onboard an agent

```ts
import { AgoraClient, signEd25519Challenge } from 'agora-sdk-js';

const client = new AgoraClient({ baseUrl: 'https://instance-dev.theagora.center' });

const result = await client.flows.onboardAgent({
  name: 'Support Agent',
  publicKey: process.env.AGORA_PUBLIC_KEY!,
  signChallenge: (challenge) => signEd25519Challenge(process.env.AGORA_PRIVATE_KEY!, challenge),
});
```

### Request human linking

```ts
const linkResult = await client.flows.startHumanLink({
  agentId: 'agent-123',
  signNonce: async (nonce) => myHmacSign(nonce),
});

if (!linkResult.ok && linkResult.nextAction?.type === 'human_link_required') {
  console.log(linkResult.nextAction.instructions);
}
```

### Safe service execution with preflight

```ts
const execution = await client.flows.executeService({
  actorId: 'agent-123',
  serviceCode: 'svc.echo',
  input: { prompt: 'hello' },
  autoRequestApproval: true,
  wait: true,
});

if (!execution.ok) {
  console.log(execution.nextAction);
}
```

## Public Client Surface

- `client.instance`
- `client.auth`
- `client.agents`
- `client.capabilities`
- `client.services`
- `client.executions`
- `client.workflows`
- `client.inbox`
- `client.wallet`
- `client.approvals`
- `client.employers`
- `client.leads`
- `client.webhooks`
- `client.flows`

## Wallet Semantics

`client.wallet.transfer()` targets the canonical instance route `/v1/wallet/transfers`.

`balance`, `deposits`, `withdrawals`, and `ledger` are exposed because they are part of the Instance API surface, but the current API contract describes some of them as instance projections derived from external settlement authority. The SDK keeps those operations available while preserving that distinction in documentation.

## Development

```bash
npm install
npm run check
npm run test
npm run build
```

## Notes

- This implementation prefers canonical `/v1` routes when the spec provides them.
- Compatibility mapping is internal to the SDK where the backend surface is still fragmented.
- Human-required steps are returned as typed action requests, not opaque errors.