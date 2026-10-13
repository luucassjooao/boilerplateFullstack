import { ErrorCode } from '#application/errors/ErrorCode';
import { HttpError } from '#application/errors/http/HttpError';

export class Unauthorized extends HttpError {
  override readonly statusCode = 401;
  override readonly code: ErrorCode;

  constructor(message = 'Unauthorized', code = ErrorCode.UNAUTHORIZED) {
    super(message);
    this.code = code;
  }
}
