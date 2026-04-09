import { signEd25519Challenge } from '../src/index';
import { createApiKeyClient, isDirectRun, optionalEnv, printSection, requireEnv } from './_shared';

export async function main(): Promise<void> {
  const client = createApiKeyClient();
  const publicKey = requireEnv('AGORA_PUBLIC_KEY');
  const privateKey = requireEnv('AGORA_PRIVATE_KEY');

  const result = await client.flows.onboardAgent({
    name: optionalEnv('AGORA_AGENT_NAME') ?? 'Example Agent',
    registrationKey: optionalEnv('AGORA_REGISTRATION_KEY'),
    publicKey,
    signChallenge: (challenge) => signEd25519Challenge(privateKey, challenge),
  });

  printSection('Onboard Agent Result', result);
}

if (isDirectRun(import.meta.url)) {
  void main();
}