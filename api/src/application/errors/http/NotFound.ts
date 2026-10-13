import { ErrorCode } from '#application/errors/ErrorCode';
import { HttpError } from '#application/errors/http/HttpError';

export class NotFound extends HttpError {
  override readonly statusCode = 404;
  override readonly code: ErrorCode;

  constructor(message = 'Not found', code = ErrorCode.NOT_FOUND) {
    super(message);
    this.code = code;
  }
}
