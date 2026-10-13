export interface IEmailGateway {
  send(email: IEmailGateway.Email): Promise<void>;
}

export namespace IEmailGateway {
  export type Email = {
    to: string;
    subject: string;
    html: string;
    text: string;
  };
}
