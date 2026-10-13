import { and, desc, eq, isNull, lt, sql } from 'drizzle-orm';
import type { IVerificationCodesRepository } from '#application/contracts/repositories/IVerificationCodesRepository';
import type { VerificationCode } from '#application/entities/VerificationCode';
import type { DrizzleDatabase } from '#infra/database/drizzle/client';
import { VerificationCodeMapper } from '#infra/database/drizzle/mappers/VerificationCodeMapper';
import { verificationCodes } from '#infra/database/drizzle/schema/index';

export class DrizzleVerificationCodesRepository implements IVerificationCodesRepository {
  constructor(private readonly db: DrizzleDatabase) {}

  async replace(code: VerificationCode): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .delete(verificationCodes)
        .where(and(eq(verificationCodes.userId, code.userId), eq(verificationCodes.purpose, code.purpose)));
      await tx.insert(verificationCodes).values(VerificationCodeMapper.toPersistence(code));
    });
  }

  async findActive(userId: string, purpose: VerificationCode.Purpose): Promise<VerificationCode | null> {
    const [row] = await this.db
      .select()
      .from(verificationCodes)
      .where(and(
        eq(verificationCodes.userId, userId),
        eq(verificationCodes.purpose, purpose),
        isNull(verificationCodes.consumedAt),
      ))
      .orderBy(desc(verificationCodes.createdAt))
      .limit(1);

    return row ? VerificationCodeMapper.toEntity(row) : null;
  }

  async registerAttempt(id: string, maxAttempts: number): Promise<boolean> {
    const rows = await this.db
      .update(verificationCodes)
      .set({ attempts: sql`${verificationCodes.attempts} + 1` })
      .where(and(
        eq(verificationCodes.id, id),
        isNull(verificationCodes.consumedAt),
        lt(verificationCodes.attempts, maxAttempts),
      ))
      .returning({ id: verificationCodes.id });

    return rows.length > 0;
  }

  async consume(id: string, now: Date): Promise<boolean> {
    const rows = await this.db
      .update(verificationCodes)
      .set({ consumedAt: now })
      .where(and(eq(verificationCodes.id, id), isNull(verificationCodes.consumedAt)))
      .returning({ id: verificationCodes.id });

    return rows.length > 0;
  }
}
