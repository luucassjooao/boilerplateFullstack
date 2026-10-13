import { ErrorCode } from '#application/errors/ErrorCode';
import { HttpError } from '#application/errors/http/HttpError';

export class BadRequest extends HttpError {
  override readonly statusCode = 400;
  override readonly code: ErrorCode;

  constructor(message = 'Bad request', code = ErrorCode.BAD_REQUEST) {
    super(message);
    this.code = code;
  }
}
