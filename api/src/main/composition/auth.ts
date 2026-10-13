import { ForgotPasswordController } from '#application/controllers/auth/ForgotPasswordController';
import { RefreshSessionController } from '#application/controllers/auth/RefreshSessionController';
import { ResendVerificationEmailController } from '#application/controllers/auth/ResendVerificationEmailController';
import { ResetPasswordController } from '#application/controllers/auth/ResetPasswordController';
import { SessionTransport } from '#application/controllers/auth/SessionTransport';
import { SignInController } from '#application/controllers/auth/SignInController';
import { SignOutController } from '#application/controllers/auth/SignOutController';
import { SignUpController } from '#application/controllers/auth/SignUpController';
import { VerifyEmailController } from '#application/controllers/auth/VerifyEmailController';
import { VerificationCodeService } from '#application/services/VerificationCodeService';
import { ConsumeVerificationCodeUseCase } from '#application/usecases/auth/ConsumeVerificationCodeUseCase';
import { ForgotPasswordUseCase } from '#application/usecases/auth/ForgotPasswordUseCase';
import { RefreshSessionUseCase } from '#application/usecases/auth/RefreshSessionUseCase';
import { ResendVerificationEmailUseCase } from '#application/usecases/auth/ResendVerificationEmailUseCase';
import { ResetPasswordUseCase } from '#application/usecases/auth/ResetPasswordUseCase';
import { SendVerificationCodeUseCase } from '#application/usecases/auth/SendVerificationCodeUseCase';
import { SignInUseCase } from '#application/usecases/auth/SignInUseCase';
import { SignOutUseCase } from '#application/usecases/auth/SignOutUseCase';
import { SignUpUseCase } from '#application/usecases/auth/SignUpUseCase';
import { StartSessionUseCase } from '#application/usecases/auth/StartSessionUseCase';
import { VerifyEmailUseCase } from '#application/usecases/auth/VerifyEmailUseCase';
import { verificationCodeEmail } from '#infra/email/templates/verificationCodeEmail';
import type { Infra } from '#main/composition/infra';
import type { AppConfig } from '#main/config/AppConfig';

export function makeAuthModule(config: AppConfig, infra: Infra) {
  const { auth } = config;
  const verificationCodeService = new VerificationCodeService(auth.codeHashSecret);

  const sessionTransport = new SessionTransport({
    allowedOrigins: config.web.origins,
    secureCookies: config.cookies.secure,
    refreshTokenTtlSeconds: auth.refreshTokenTtlSeconds,
  });

  const startSession = new StartSessionUseCase(
    infra.refreshTokensRepository,
    infra.accessTokenService,
    infra.opaqueTokenService,
    { refreshTokenTtlSeconds: auth.refreshTokenTtlSeconds },
  );

  const sendVerificationCode = new SendVerificationCodeUseCase(
    infra.verificationCodesRepository,
    verificationCodeService,
    infra.emailGateway,
    { verificationCode: verificationCodeEmail },
    { ttlSeconds: auth.verificationCodeTtlSeconds },
  );

  const consumeVerificationCode = new ConsumeVerificationCodeUseCase(
    infra.verificationCodesRepository,
    verificationCodeService,
    { maxAttempts: auth.verificationCodeMaxAttempts },
  );

  return {
    sessionTransport,
    startSession,
    controllers: {
      signUp: new SignUpController(
        new SignUpUseCase(infra.usersRepository, infra.passwordHasher, sendVerificationCode),
      ),
      verifyEmail: new VerifyEmailController(
        new VerifyEmailUseCase(infra.usersRepository, consumeVerificationCode, startSession),
        sessionTransport,
      ),
      resendVerificationEmail: new ResendVerificationEmailController(
        new ResendVerificationEmailUseCase(infra.usersRepository, sendVerificationCode),
      ),
      signIn: new SignInController(
        new SignInUseCase(infra.usersRepository, infra.passwordHasher, startSession),
        sessionTransport,
      ),
      refresh: new RefreshSessionController(
        new RefreshSessionUseCase(
          infra.refreshTokensRepository,
          infra.opaqueTokenService,
          startSession,
          { reuseGraceSeconds: auth.refreshTokenReuseGraceSeconds },
        ),
        sessionTransport,
      ),
      signOut: new SignOutController(
        new SignOutUseCase(infra.refreshTokensRepository, infra.opaqueTokenService),
        sessionTransport,
      ),
      forgotPassword: new ForgotPasswordController(
        new ForgotPasswordUseCase(infra.usersRepository, sendVerificationCode),
      ),
      resetPassword: new ResetPasswordController(
        new ResetPasswordUseCase(
          infra.usersRepository,
          infra.refreshTokensRepository,
          infra.passwordHasher,
          consumeVerificationCode,
        ),
      ),
    },
  };
}

export type AuthModule = ReturnType<typeof makeAuthModule>;
