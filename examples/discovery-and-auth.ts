import { createApiKeyClient, isDirectRun, printSection } from './_shared';

export async function main(): Promise<void> {
  const client = createApiKeyClient();

  const [manifest, info, authModes, capabilities] = await Promise.all([
    client.instance.getManifest(),
    client.instance.getInfo(),
    client.auth.getModes(),
    client.capabilities.discover(),
  ]);

  printSection('Instance Manifest', manifest);
  printSection('Instance Info', info);
  printSection('Auth Modes', authModes);
  printSection('Capabilities', capabilities);
}

if (isDirectRun(import.meta.url)) {
  void main();
}
