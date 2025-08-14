import { AuthService, LoginInput } from '@budget/auth';
import { ITokenService } from './token-service.js';

export class SessionAuthService {
  constructor(private auth: AuthService, private tokens: ITokenService) {}
  async loginWithTokens(input: LoginInput) {
    const { user } = await this.auth.login(input);
    const issued = await this.tokens.issueSession(user);
    return { user, ...issued };
  }
}
