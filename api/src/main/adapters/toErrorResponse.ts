import { ZodError } from 'zod';
import { ApplicationError } from '#application/errors/application/ApplicationError';
import { ErrorCode } from '#application/errors/ErrorCode';
import { HttpError } from '#application/errors/http/HttpError';

export type ErrorResponse = {
  statusCode: number;
  body: {
    error: {
      code: ErrorCode;
      message: string | { field: string; error: string }[];
    };
  };
};

function response(statusCode: number, code: ErrorCode, message: ErrorResponse['body']['error']['message']): ErrorResponse {
  return { statusCode, body: { error: { code, message } } };
}

/**
 * Translates a thrown error into the API error envelope.
 * Returns null for unknown errors: the caller must log them and answer 500.
 */
export function toErrorResponse(error: unknown): ErrorResponse | null {
  if (error instanceof ZodError) {
    return response(
      400,
      ErrorCode.VALIDATION,
      error.issues.map((issue) => ({ field: issue.path.join('.'), error: issue.message })),
    );
  }

  if (error instanceof HttpError) {
    return response(error.statusCode, error.code, error.message);
  }

  if (error instanceof ApplicationError) {
    return response(error.statusCode ?? 400, error.code, error.message);
  }

  // Errors raised by Fastify itself and its plugins (invalid JSON, payload too large, rate limit...).
  const statusCode = (error as { statusCode?: unknown } | null)?.statusCode;

  if (typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500) {
    const message = error instanceof Error ? error.message : 'Bad request';

    if (statusCode === 429) {
      return response(429, ErrorCode.TOO_MANY_REQUESTS, message);
    }

    if (statusCode === 404) {
      return response(404, ErrorCode.NOT_FOUND, message);
    }

    return response(statusCode, ErrorCode.BAD_REQUEST, message);
  }

  return null;
}

export const internalServerErrorResponse = response(500, ErrorCode.INTERNAL_SERVER_ERROR, 'Internal server error');
