import { ErrorCode } from '#application/errors/ErrorCode';
import { HttpError } from '#application/errors/http/HttpError';

export class Forbidden extends HttpError {
  override readonly statusCode = 403;
  override readonly code: ErrorCode;

  constructor(message = 'Forbidden', code = ErrorCode.FORBIDDEN) {
    super(message);
    this.code = code;
  }
}
