import * as SecureStore from 'expo-secure-store';

const REFRESH_TOKEN_KEY = 'auth.refresh-token';

let accessToken: string | null = null;

/** Access token in memory; refresh token in the Keychain/Keystore (expo-secure-store, never AsyncStorage). */
export class AuthTokensManager {
  static getAccessToken(): string | null {
    return accessToken;
  }

  static getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  }

  static async save(tokens: AuthTokensManager.Tokens): Promise<void> {
    accessToken = tokens.accessToken;
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }

  static async clear(): Promise<void> {
    accessToken = null;
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  }
}

export namespace AuthTokensManager {
  export type Tokens = { accessToken: string; refreshToken: string };
}
