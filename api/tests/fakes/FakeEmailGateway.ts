import type { IEmailGateway } from '#application/contracts/gateways/IEmailGateway';

export class FakeEmailGateway implements IEmailGateway {
  readonly sent: IEmailGateway.Email[] = [];

  async send(email: IEmailGateway.Email): Promise<void> {
    this.sent.push(email);
  }

  sentTo(to: string): IEmailGateway.Email[] {
    return this.sent.filter((email) => email.to === to);
  }

  /** The 6-digit code of the last email sent to `to`. */
  lastCodeFor(to: string): string {
    const email = this.sentTo(to).at(-1);
    const code = email?.text.match(/\b(\d{6})\b/)?.[1];

    if (!code) {
      throw new Error(`No code was emailed to ${to}`);
    }

    return code;
  }
}
