import type { ErrorCode } from '#application/errors/ErrorCode';

export abstract class ApplicationError extends Error {
  abstract readonly code: ErrorCode;
  readonly statusCode?: number;
}
