/** The access token lives only in memory (never localStorage). The refresh token is an httpOnly cookie. */
let accessToken: string | null = null;

export const accessTokenStore = {
  get: () => accessToken,
  set: (token: string) => {
    accessToken = token;
  },
  clear: () => {
    accessToken = null;
  },
};
