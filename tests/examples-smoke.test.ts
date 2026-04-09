import { describe, expect, it } from 'vitest';

const modules = [
  '../examples/agentic-quickstart.ts',
  '../examples/discovery-and-auth.ts',
  '../examples/onboard-agent.ts',
  '../examples/start-human-link.ts',
  '../examples/execute-service-safe.ts',
  '../examples/request-approval-and-resume.ts',
  '../examples/execute-and-wait.ts',
  '../examples/transfer-funds.ts',
  '../examples/inbox-workflow-run.ts',
];

describe('examples smoke test', () => {
  for (const modulePath of modules) {
    it(`imports ${modulePath}`, async () => {
      const imported = await import(modulePath);
      expect(imported).toHaveProperty('main');
      expect(typeof imported.main).toBe('function');
    });
  }
});