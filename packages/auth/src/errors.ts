// Auth-specific error definitions (T-006)
// Purpose: Provide typed error codes for auth flows; codes stable for mapping to HTTP later.
export class AuthError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export const ERR_EMAIL_IN_USE = 'EMAIL_IN_USE';
export const ERR_INVALID_CREDENTIALS = 'INVALID_CREDENTIALS';
export const ERR_INVALID_EMAIL = 'INVALID_EMAIL';
export const ERR_WEAK_PASSWORD = 'WEAK_PASSWORD';
