import { AgoraClient, createHmacAuth } from '../src/index';

const client = new AgoraClient({
  baseUrl: 'https://instance.example.com',
  auth: createHmacAuth({
    agentId: 'agent-123',
    secret: 'replace-me',
  }),
});

async function main() {
  const capabilities = await client.capabilities.list();
  console.log(capabilities);

  const result = await client.flows.executeService({
    actorId: 'agent-123',
    serviceCode: 'svc.echo',
    input: { message: 'hello from AI' },
    autoRequestApproval: true,
  });

  console.log(result);
}

void main();