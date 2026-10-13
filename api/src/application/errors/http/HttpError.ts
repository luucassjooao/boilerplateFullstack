import type { ErrorCode } from '#application/errors/ErrorCode';

export abstract class HttpError extends Error {
  abstract readonly statusCode: number;
  abstract readonly code: ErrorCode;
}
