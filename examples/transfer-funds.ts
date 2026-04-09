import { createApiKeyClient, isDirectRun, printSection, requireEnv } from './_shared';

export async function main(): Promise<void> {
  const client = createApiKeyClient();

  const [beforeBalance, beforeLedger] = await Promise.all([
    client.wallet.getBalance(),
    client.wallet.getLedger(),
  ]);

  printSection('Wallet Balance Before Transfer', beforeBalance);
  printSection('Wallet Ledger Before Transfer', beforeLedger);

  const transfer = await client.flows.transferFunds({
    toAgentId: requireEnv('AGORA_TARGET_AGENT_ID'),
    amount: Number(requireEnv('AGORA_TRANSFER_AMOUNT')),
    currency: process.env.AGORA_TRANSFER_CURRENCY || 'AGO',
    memo: process.env.AGORA_TRANSFER_MEMO || 'Example internal transfer from SDK example',
  });

  printSection('Transfer Result', transfer);

  const [afterBalance, afterLedger] = await Promise.all([
    client.wallet.getBalance(),
    client.wallet.getLedger(),
  ]);

  printSection('Wallet Balance After Transfer', afterBalance);
  printSection('Wallet Ledger After Transfer', afterLedger);
}

if (isDirectRun(import.meta.url)) {
  void main();
}