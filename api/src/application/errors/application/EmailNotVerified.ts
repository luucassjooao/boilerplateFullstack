import { ApplicationError } from '#application/errors/application/ApplicationError';
import { ErrorCode } from '#application/errors/ErrorCode';

export class EmailNotVerified extends ApplicationError {
  override readonly code = ErrorCode.EMAIL_NOT_VERIFIED;
  override readonly statusCode = 403;

  constructor(message = 'Email not verified') {
    super(message);
  }
}
