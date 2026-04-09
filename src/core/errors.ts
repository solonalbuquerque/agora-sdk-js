export class AgoraError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly requestId?: string;
  readonly details?: unknown;

  constructor(message: string, options: { status?: number; code?: string; requestId?: string; details?: unknown; cause?: unknown } = {}) {
    super(message, { cause: options.cause });
    this.name = 'AgoraError';
    this.status = options.status;
    this.code = options.code;
    this.requestId = options.requestId;
    this.details = options.details;
  }
}

export class AgoraApiError extends AgoraError {
  constructor(message: string, options: ConstructorParameters<typeof AgoraError>[1] = {}) {
    super(message, options);
    this.name = 'AgoraApiError';
  }
}

export class AgoraAuthError extends AgoraApiError {
  constructor(message: string, options: ConstructorParameters<typeof AgoraError>[1] = {}) {
    super(message, options);
    this.name = 'AgoraAuthError';
  }
}

export class AgoraRateLimitError extends AgoraApiError {
  readonly retryAfter?: string | null;

  constructor(message: string, options: ConstructorParameters<typeof AgoraError>[1] & { retryAfter?: string | null } = {}) {
    super(message, options);
    this.name = 'AgoraRateLimitError';
    this.retryAfter = options.retryAfter;
  }
}

export class AgoraValidationError extends AgoraApiError {
  constructor(message: string, options: ConstructorParameters<typeof AgoraError>[1] = {}) {
    super(message, options);
    this.name = 'AgoraValidationError';
  }
}

export class AgoraIdempotencyConflictError extends AgoraApiError {
  constructor(message: string, options: ConstructorParameters<typeof AgoraError>[1] = {}) {
    super(message, options);
    this.name = 'AgoraIdempotencyConflictError';
  }
}

export class AgoraTimeoutError extends AgoraError {
  constructor(message: string, options: ConstructorParameters<typeof AgoraError>[1] = {}) {
    super(message, options);
    this.name = 'AgoraTimeoutError';
  }
}
