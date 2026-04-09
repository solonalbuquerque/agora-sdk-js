import type { Dictionary, RequestOptions, WalletBalance, WalletTransfer, WalletTransferInput } from '../types';
import { toArrayResult, unwrapData } from '../core/utils';
import { BaseResource } from './base';

export class WalletResource extends BaseResource {
  async getBalance(options?: RequestOptions): Promise<WalletBalance> {
    return unwrapData(await this.http.get('/api/v1/wallet/balance', options));
  }

  async getStatement(query?: Record<string, string | number | boolean | null | undefined>, options?: RequestOptions): Promise<Dictionary[]> {
    return this.getLedger(query, options);
  }

  async listDeposits(query?: Record<string, string | number | boolean | null | undefined>, options?: RequestOptions): Promise<Dictionary[]> {
    return toArrayResult(await this.http.get('/api/v1/wallet/deposits', { ...options, query }));
  }

  async createDeposit(body: Dictionary, options?: RequestOptions): Promise<Dictionary> {
    return unwrapData(await this.http.post('/api/v1/wallet/deposits', body, options));
  }

  async listWithdrawals(query?: Record<string, string | number | boolean | null | undefined>, options?: RequestOptions): Promise<Dictionary[]> {
    return toArrayResult(await this.http.get('/api/v1/wallet/withdrawals', { ...options, query }));
  }

  async createWithdrawal(body: Dictionary, options?: RequestOptions): Promise<Dictionary> {
    return unwrapData(await this.http.post('/api/v1/wallet/withdrawals', body, options));
  }

  async getLedger(query?: Record<string, string | number | boolean | null | undefined>, options?: RequestOptions): Promise<Dictionary[]> {
    return toArrayResult(await this.http.get('/api/v1/wallet/ledger', { ...options, query }));
  }

  async transfer(input: WalletTransferInput, options?: RequestOptions): Promise<WalletTransfer> {
    return unwrapData(await this.http.post('/v1/wallet/transfers', {
      toAgentId: input.toAgentId,
      toWalletId: input.toWalletId,
      amount: input.amount,
      currency: input.currency,
      memo: input.memo,
      idempotencyKey: input.idempotencyKey,
    }, options));
  }
}