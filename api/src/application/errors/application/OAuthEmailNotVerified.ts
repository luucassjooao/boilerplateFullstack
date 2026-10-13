import { ApplicationError } from '#application/errors/application/ApplicationError';
import { ErrorCode } from '#application/errors/ErrorCode';

export class OAuthEmailNotVerified extends ApplicationError {
  override readonly code = ErrorCode.OAUTH_EMAIL_NOT_VERIFIED;
  override readonly statusCode = 403;

  constructor(message = 'The provider did not verify this email') {
    super(message);
  }
}
