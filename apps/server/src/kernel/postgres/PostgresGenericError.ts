export class PostgresGenericError extends Error {
  public static readonly code = 'POSTGRES_GENERIC_ERROR';
  public readonly code = PostgresGenericError.code;

  public static fromMessage(message: string) {
    return new PostgresGenericError(message);
  }

  public static fromError(error: Error, message?: string) {
    return new PostgresGenericError(message ?? error.message, error);
  }

  public static fromUnknown(error: unknown, message?: string) {
    return new PostgresGenericError(
      message ?? 'An unknown error occurred',
      error instanceof Error ? error : undefined,
    );
  }
}
