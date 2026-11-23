
export interface AuthAccountRecord {
  id: string;
  passwordHash: string | null;
}

export interface AuthRepository {
  findByEmail(email: string): Promise<AuthAccountRecord | null>;
  createAccount(input: CreateAuthAccountInput): Promise<string>;
}

export interface CreateAuthAccountInput {
  email: string;
  username: string;
  displayName: string;
  passwordHash: string;
}