export interface IAccessTokenService {
  sign(payload: { userId: string }): Promise<string>;
  verify(token: string): Promise<{ userId: string } | null>;
}
