import { VerificationCode } from '#application/entities/VerificationCode';
import type { verificationCodes } from '#infra/database/drizzle/schema/index';

export class VerificationCodeMapper {
  static toEntity(row: typeof verificationCodes.$inferSelect): VerificationCode {
    return new VerificationCode(row);
  }

  static toPersistence(code: VerificationCode): typeof verificationCodes.$inferInsert {
    return {
      id: code.id,
      userId: code.userId,
      purpose: code.purpose,
      codeHash: code.codeHash,
      expiresAt: code.expiresAt,
      attempts: code.attempts,
      consumedAt: code.consumedAt,
      createdAt: code.createdAt,
    };
  }
}
