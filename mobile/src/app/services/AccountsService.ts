import { Service } from '@app/services/Service';
import type { OAuthProvider } from '@app/types/OAuthProvider';

export class AccountsService extends Service {
  static async me(): Promise<AccountsService.Me> {
    const { data } = await this.client.get<AccountsService.Me>('/me');

    return data;
  }
}

export namespace AccountsService {
  export type Me = {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    providers: OAuthProvider[];
  };
}
