import type { Logger } from 'pino';
import type { IEmailGateway } from '#application/contracts/gateways/IEmailGateway';

/** Development only: writes the email to the log instead of sending it. */
export class ConsoleEmailGateway implements IEmailGateway {
  constructor(private readonly logger: Logger) {}

  async send({ to, subject, text }: IEmailGateway.Email): Promise<void> {
    this.logger.info({ email: { to, subject, text } }, 'Email not sent (EMAIL_PROVIDER=console)');
  }
}
