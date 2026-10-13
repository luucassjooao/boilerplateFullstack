import type { IVerificationCodesRepository } from '#application/contracts/repositories/IVerificationCodesRepository';
import { VerificationCode } from '#application/entities/VerificationCode';
import { InMemoryDatabase } from '#infra/database/in-memory/InMemoryDatabase';

export class InMemoryVerificationCodesRepository implements IVerificationCodesRepository {
  constructor(private readonly database: InMemoryDatabase) {}

  async replace(code: VerificationCode): Promise<void> {
    this.database.verificationCodes = [
      ...this.database.verificationCodes.filter(
        (item) => !(item.userId === code.userId && item.purpose === code.purpose),
      ),
      InMemoryDatabase.copy(code),
    ];
  }

  async findActive(userId: string, purpose: VerificationCode.Purpose): Promise<VerificationCode | null> {
    const code = this.database.verificationCodes
      .filter((item) => item.userId === userId && item.purpose === purpose && !item.consumedAt)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

    return code ? InMemoryDatabase.copy(code) : null;
  }

  async registerAttempt(id: string, maxAttempts: number): Promise<boolean> {
    return this.updateWhere(
      (item) => item.id === id && !item.consumedAt && item.attempts < maxAttempts,
      (item) => new VerificationCode({ ...item, attempts: item.attempts + 1 }),
    );
  }

  async consume(id: string, now: Date): Promise<boolean> {
    return this.updateWhere(
      (item) => item.id === id && !item.consumedAt,
      (item) => new VerificationCode({ ...item, consumedAt: now }),
    );
  }

  private updateWhere(
    predicate: (code: VerificationCode) => boolean,
    change: (code: VerificationCode) => VerificationCode,
  ): boolean {
    const index = this.database.verificationCodes.findIndex(predicate);
    const code = this.database.verificationCodes[index];

    if (!code) {
      return false;
    }

    this.database.verificationCodes[index] = change(code);

    return true;
  }
}
