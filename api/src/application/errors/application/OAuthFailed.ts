import { ApplicationError } from '#application/errors/application/ApplicationError';
import { ErrorCode } from '#application/errors/ErrorCode';

export class OAuthFailed extends ApplicationError {
  override readonly code = ErrorCode.OAUTH_FAILED;
  override readonly statusCode = 401;

  constructor(message = 'OAuth authentication failed') {
    super(message);
  }
}
