
import type { createDatabase } from "../db/postgres.connection.js";
import { sessions } from "../db/schema/sessions.schema.js";
import type {
  SessionRepository,
} from "../interfaces/session-repository.interface.js";

type Database = ReturnType<typeof createDatabase>["db"];

export function createSessionRepository(db: Database): SessionRepository {
  return {
    async createSession(input) {
      const [session] = await db
        .insert(sessions)
        .values({
          userId: input.userId,
          tokenHash: input.tokenHash,
          expiresAt: input.expiresAt,
        })
        .returning({ id: sessions.id });

      if (!session) {
        throw new Error("Failed to create session");
      }

      return session.id;
    },
  };
}
