import { ApplicationError } from '#application/errors/application/ApplicationError';
import { ErrorCode } from '#application/errors/ErrorCode';

export class EmailAlreadyInUse extends ApplicationError {
  override readonly code = ErrorCode.EMAIL_ALREADY_IN_USE;
  override readonly statusCode = 409;

  constructor(message = 'Email already in use') {
    super(message);
  }
}
