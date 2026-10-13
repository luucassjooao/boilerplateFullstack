/** Postgres unique_violation (23505), unwrapping DrizzleQueryError. Optionally matches the constraint name. */
export function isUniqueViolation(error: unknown, constraint?: string): boolean {
  const pgError = (error as { cause?: unknown })?.cause ?? error;
  const { code, constraint: violated } = (pgError ?? {}) as { code?: string; constraint?: string };

  return code === '23505' && (!constraint || violated === constraint);
}
