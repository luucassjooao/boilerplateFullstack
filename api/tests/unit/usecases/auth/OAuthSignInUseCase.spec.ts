import { beforeEach, describe, expect, it } from 'vitest';
import type { IOAuthProfile } from '#application/contracts/gateways/IOAuthProvider';
import { OAuthEmailNotVerified } from '#application/errors/application/OAuthEmailNotVerified';
import { OAuthFailed } from '#application/errors/application/OAuthFailed';
import { OAuthSignInUseCase } from '#application/usecases/auth/OAuthSignInUseCase';
import { makeAuthIdentity } from '#tests/factories/makeAuthIdentity';
import { makeUser } from '#tests/factories/makeUser';
import { makeUnitDeps, type UnitDeps } from '#tests/unit/makeUnitDeps';

describe('OAuthSignInUseCase', () => {
  let deps: UnitDeps;
  let sut: OAuthSignInUseCase;

  const profile = (override: Partial<IOAuthProfile> = {}): IOAuthProfile => ({
    providerUserId: 'google-sub-1',
    email: 'ada@example.com',
    emailVerified: true,
    name: 'Ada From Google',
    ...override,
  });

  async function userIdOfSession(accessToken: string) {
    return (await deps.accessTokenService.verify(accessToken))?.userId;
  }

  beforeEach(() => {
    deps = makeUnitDeps();
    sut = new OAuthSignInUseCase(deps.usersRepository, deps.authIdentitiesRepository, deps.startSession);
  });

  it('signs in the owner of a known identity, even if the email changed', async () => {
    const user = makeUser({ name: 'Original' });
    await deps.usersRepository.createWithIdentity(
      user,
      makeAuthIdentity({ userId: user.id, provider: 'google', providerUserId: 'google-sub-1' }),
    );

    const session = await sut.execute({
      provider: 'google',
      profile: profile({ email: 'changed@example.com', emailVerified: false }),
      name: 'Ignored',
      userAgent: null,
    });

    expect(await userIdOfSession(session.accessToken)).toBe(user.id);
    expect((await deps.usersRepository.findById(user.id))?.name).toBe('Original');
  });

  it('links to an existing account with the same verified email and verifies it', async () => {
    const user = makeUser({ email: 'ada@example.com', emailVerifiedAt: null });
    await deps.usersRepository.create(user);

    const session = await sut.execute({ provider: 'apple', profile: profile({ email: 'ADA@example.com' }), userAgent: null });

    expect(await userIdOfSession(session.accessToken)).toBe(user.id);
    expect((await deps.usersRepository.findById(user.id))?.emailVerified).toBe(true);
    expect((await deps.authIdentitiesRepository.listByUserId(user.id)).map((item) => item.provider)).toEqual(['apple']);
  });

  it('refuses emails the provider did not verify (no link, no account)', async () => {
    const user = makeUser({ email: 'ada@example.com' });
    await deps.usersRepository.create(user);

    await expect(sut.execute({ provider: 'google', profile: profile({ emailVerified: false }), userAgent: null }))
      .rejects.toBeInstanceOf(OAuthEmailNotVerified);
    await expect(sut.execute({
      provider: 'google',
      profile: profile({ email: 'new@example.com', emailVerified: false }),
      userAgent: null,
    })).rejects.toBeInstanceOf(OAuthEmailNotVerified);
    expect(deps.database.authIdentities).toHaveLength(0);
    expect(deps.database.users).toHaveLength(1);
  });

  it('fails when the provider shares no email', async () => {
    await expect(sut.execute({ provider: 'apple', profile: profile({ email: null }), userAgent: null }))
      .rejects.toBeInstanceOf(OAuthFailed);
  });

  it('creates a verified, password-less user with the identity', async () => {
    const session = await sut.execute({ provider: 'google', profile: profile(), userAgent: null });

    const user = await deps.usersRepository.findByEmail('ada@example.com');

    expect(await userIdOfSession(session.accessToken)).toBe(user?.id);
    expect(user).toMatchObject({ name: 'Ada From Google', passwordHash: null });
    expect(user?.emailVerified).toBe(true);
    expect(await deps.authIdentitiesRepository.findByProviderUserId('google', 'google-sub-1')).not.toBeNull();
  });

  it('prefers the client-sent name (Apple first sign-in), then the profile, then the email', async () => {
    await sut.execute({ provider: 'apple', profile: profile({ providerUserId: 'a', email: 'a@x.com', name: null }), name: ' Ada L ', userAgent: null });
    await sut.execute({ provider: 'apple', profile: profile({ providerUserId: 'b', email: 'b@x.com', name: 'Profile' }), userAgent: null });
    await sut.execute({ provider: 'apple', profile: profile({ providerUserId: 'c', email: 'grace@x.com', name: null }), userAgent: null });

    const names = await Promise.all(['a@x.com', 'b@x.com', 'grace@x.com'].map(
      async (email) => (await deps.usersRepository.findByEmail(email))?.name,
    ));

    expect(names).toEqual(['Ada L', 'Profile', 'grace']);
  });
});
