import { ApplicationError } from '#application/errors/application/ApplicationError';
import { ErrorCode } from '#application/errors/ErrorCode';

export class InvalidRefreshToken extends ApplicationError {
  override readonly code = ErrorCode.INVALID_REFRESH_TOKEN;
  override readonly statusCode = 401;

  constructor(message = 'Invalid refresh token') {
    super(message);
  }
}
