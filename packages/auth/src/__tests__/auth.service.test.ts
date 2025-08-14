import { describe, it, expect } from 'vitest';
import { InMemoryUserRepository } from '../repository.js';
import { AuthService } from '../service.js';
import { ERR_EMAIL_IN_USE, ERR_INVALID_CREDENTIALS, ERR_INVALID_EMAIL, ERR_WEAK_PASSWORD } from '../errors.js';

describe('AuthService (T-006)', () => {
  function setup() {
    const repo = new InMemoryUserRepository();
    const service = new AuthService(repo);
    return { repo, service };
  }

  it('registers a new user with valid credentials and hashes password', async () => {
    const { repo, service } = setup();
    const rawPassword = 'StrongPassw0rd!';
    const { user } = await service.register({ email: 'Test@Example.com', password: rawPassword });
    expect(user.email).toBe('test@example.com');
    const stored = await repo.findByEmail('test@example.com');
    expect(stored).not.toBeNull();
  if (!stored) throw new Error('user not stored');
  expect(stored.passwordHash).not.toBe(rawPassword);
  expect(stored.passwordHash).toMatch(/\$/); // argon2 hash contains $ sections
  });

  it('enforces unique email', async () => {
    const { service } = setup();
    await service.register({ email: 'dup@example.com', password: 'StrongPassw0rd!' });
    await expect(
      service.register({ email: 'dup@example.com', password: 'AnotherStrongPassw0rd!' })
    ).rejects.toMatchObject({ code: ERR_EMAIL_IN_USE });
  });

  it('rejects invalid email', async () => {
    const { service } = setup();
    await expect(
      service.register({ email: 'bad-email', password: 'StrongPassw0rd!' })
    ).rejects.toMatchObject({ code: ERR_INVALID_EMAIL });
  });

  it('rejects weak password', async () => {
    const { service } = setup();
    await expect(
      service.register({ email: 'weak@example.com', password: 'short1' })
    ).rejects.toMatchObject({ code: ERR_WEAK_PASSWORD });
  });

  it('logs in with correct credentials', async () => {
    const { service } = setup();
    await service.register({ email: 'login@example.com', password: 'StrongPassw0rd!' });
    const { user } = await service.login({ email: 'login@example.com', password: 'StrongPassw0rd!' });
    expect(user.email).toBe('login@example.com');
  });

  it('rejects invalid credentials (wrong password)', async () => {
    const { service } = setup();
    await service.register({ email: 'fail@example.com', password: 'StrongPassw0rd!' });
    await expect(
      service.login({ email: 'fail@example.com', password: 'WrongPassword123' })
    ).rejects.toMatchObject({ code: ERR_INVALID_CREDENTIALS });
  });

  it('rejects invalid credentials (unknown email)', async () => {
    const { service } = setup();
    await expect(
      service.login({ email: 'nouser@example.com', password: 'StrongPassw0rd!' })
    ).rejects.toMatchObject({ code: ERR_INVALID_CREDENTIALS });
  });
});
