import { ApplicationError } from '#application/errors/application/ApplicationError';
import { ErrorCode } from '#application/errors/ErrorCode';

export class InvalidVerificationCode extends ApplicationError {
  override readonly code = ErrorCode.INVALID_VERIFICATION_CODE;
  override readonly statusCode = 400;

  constructor(message = 'Invalid or expired verification code') {
    super(message);
  }
}
