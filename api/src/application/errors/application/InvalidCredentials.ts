import { ApplicationError } from '#application/errors/application/ApplicationError';
import { ErrorCode } from '#application/errors/ErrorCode';

export class InvalidCredentials extends ApplicationError {
  override readonly code = ErrorCode.INVALID_CREDENTIALS;
  override readonly statusCode = 401;

  constructor(message = 'Invalid credentials') {
    super(message);
  }
}
