import type { VerificationCode } from '#application/entities/VerificationCode';

export interface IVerificationCodesRepository {
  /** Stores the code and invalidates every other code of the same user and purpose. */
  replace(code: VerificationCode): Promise<void>;
  /** Latest non-consumed code of the user for the purpose (expired or not). */
  findActive(userId: string, purpose: VerificationCode.Purpose): Promise<VerificationCode | null>;
  /**
   * Atomically increments `attempts` if the code is not consumed and has fewer than `maxAttempts`.
   * Returns false when no attempt is left.
   */
  registerAttempt(id: string, maxAttempts: number): Promise<boolean>;
  /** Atomically marks the code as consumed. Returns false if it was already consumed. */
  consume(id: string, now: Date): Promise<boolean>;
}
