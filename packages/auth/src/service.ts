// AuthService (T-006)
// Purpose: Provide register & login capabilities with Argon2 hashing and basic validation.
// Boundary: Depends only on IUserRepository & domain types. No HTTP or DB specifics.
import { hash as argon2Hash, verify as argon2Verify, argon2id } from 'argon2';
import { User } from '@budget/domain';
import { IUserRepository } from './repository.js';
import { AuthError, ERR_EMAIL_IN_USE, ERR_INVALID_CREDENTIALS, ERR_INVALID_EMAIL, ERR_WEAK_PASSWORD } from './errors.js';

export interface RegistrationInput { email: string; password: string; }
export interface LoginInput { email: string; password: string; }

// Argon2 parameters: modest for test speed; can be tuned later (see forthcoming security baseline doc T-013)
const ARGON2_OPTS: Parameters<typeof argon2Hash>[1] = {
  type: argon2id,
  memoryCost: 19456, // ~19MB
  timeCost: 2,
  parallelism: 1,
};

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const MIN_PASSWORD_LEN = 12;

export class AuthService {
  constructor(private repo: IUserRepository) {}

  async register(input: RegistrationInput): Promise<{ user: User }> {
    const email = input.email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) throw new AuthError('Invalid email format', ERR_INVALID_EMAIL);
    if (input.password.length < MIN_PASSWORD_LEN) throw new AuthError('Password too short', ERR_WEAK_PASSWORD);

    const existing = await this.repo.findByEmail(email);
    if (existing) throw new AuthError('Email already in use', ERR_EMAIL_IN_USE);

  const passwordHash = await argon2Hash(input.password, ARGON2_OPTS);
  const record = await this.repo.create(email, passwordHash);
  const { passwordHash: _omitted, ...user } = record; // exclude sensitive field
    return { user };
  }

  async login(input: LoginInput): Promise<{ user: User }> {
    const email = input.email.trim().toLowerCase();
    const record = await this.repo.findByEmail(email);
    if (!record) throw new AuthError('Invalid credentials', ERR_INVALID_CREDENTIALS);
  const ok = await argon2Verify(record.passwordHash, input.password);
    if (!ok) throw new AuthError('Invalid credentials', ERR_INVALID_CREDENTIALS);
  const { passwordHash: _omitted, ...user } = record;
    return { user };
  }
}
