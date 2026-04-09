import type { AgoraClientOptions } from './types';
import { HttpClient } from './core/http';
import {
  AgentsResource,
  ApprovalsResource,
  AuthResource,
  CapabilitiesResource,
  EmployersResource,
  ExecutionsResource,
  InboxResource,
  InstanceResource,
  LeadsResource,
  ServicesResource,
  WalletResource,
  WebhooksResource,
  WorkflowsResource,
} from './resources';
import { AgoraFlows } from './flows';

export class AgoraClient {
  readonly http: HttpClient;
  readonly instance: InstanceResource;
  readonly auth: AuthResource;
  readonly agents: AgentsResource;
  readonly capabilities: CapabilitiesResource;
  readonly services: ServicesResource;
  readonly executions: ExecutionsResource;
  readonly workflows: WorkflowsResource;
  readonly inbox: InboxResource;
  readonly wallet: WalletResource;
  readonly approvals: ApprovalsResource;
  readonly employers: EmployersResource;
  readonly leads: LeadsResource;
  readonly webhooks: WebhooksResource;
  readonly flows: AgoraFlows;

  constructor(options: AgoraClientOptions) {
    this.http = new HttpClient(options);
    this.instance = new InstanceResource(this.http);
    this.auth = new AuthResource(this.http);
    this.agents = new AgentsResource(this.http);
    this.capabilities = new CapabilitiesResource(this.http);
    this.services = new ServicesResource(this.http);
    this.executions = new ExecutionsResource(this.http);
    this.workflows = new WorkflowsResource(this.http);
    this.inbox = new InboxResource(this.http);
    this.wallet = new WalletResource(this.http);
    this.approvals = new ApprovalsResource(this.http);
    this.employers = new EmployersResource(this.http);
    this.leads = new LeadsResource(this.http);
    this.webhooks = new WebhooksResource(this.http);
    this.flows = new AgoraFlows(this);
  }
}