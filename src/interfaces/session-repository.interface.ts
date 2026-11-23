
export interface CreateSessionInput {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface SessionRepository {
  createSession(input: CreateSessionInput): Promise<string>;
}
