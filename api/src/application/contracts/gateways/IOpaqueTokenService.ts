export interface IOpaqueTokenService {
  /** Random token to hand to the client and the hash to persist. */
  generate(): { token: string; hash: string };
  hash(token: string): string;
}
