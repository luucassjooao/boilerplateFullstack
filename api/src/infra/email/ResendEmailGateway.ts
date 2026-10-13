import { Resend } from 'resend';
import type { IEmailGateway } from '#application/contracts/gateways/IEmailGateway';

export class ResendEmailGateway implements IEmailGateway {
  private readonly resend: Resend;

  constructor(private readonly options: ResendEmailGateway.Options) {
    this.resend = new Resend(options.apiKey);
  }

  async send(email: IEmailGateway.Email): Promise<void> {
    const { error } = await this.resend.emails.send({ from: this.options.from, ...email });

    if (error) {
      throw new Error(`Resend failed to send email: ${error.name}: ${error.message}`);
    }
  }
}

export namespace ResendEmailGateway {
  export type Options = { apiKey: string; from: string };
}
