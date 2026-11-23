
import { eq } from "drizzle-orm";

import type { createDatabase } from "../db/postgres.connection.js";
import { users } from "../db/schema/users.schema.js";
import { profiles } from "../db/schema/profiles.schema.js";
import type { CreateAuthAccountInput } from "../interfaces/auth-repository.interface.js";
import { AccountAlreadyExistsError } from "../shared/errors/account-already-exists.error.js";

type Database = ReturnType<typeof createDatabase>["db"];

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  if ("code" in error && error.code === "23505") {
    return true;
  }

  return "cause" in error && isUniqueViolation(error.cause);
}

export function createAuthRepository(db: Database) {
  return {
    async findByEmail(email: string) {
      const emailNormalized = email.trim().toLowerCase();

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.emailNormalized, emailNormalized))
        .limit(1);

      return user ?? null;
    },


    async createAccount(input: CreateAuthAccountInput) {
      const email = input.email.trim();
      try {


        return await db.transaction(async (tx) => {
          const [user] = await tx
            .insert(users)
            .values({
              email,
              emailNormalized: email.toLowerCase(),
              username: input.username.trim(),
              displayName: input.displayName.trim(),
              passwordHash: input.passwordHash,
            })
            .returning({ id: users.id });

          if (!user) {
            throw new Error("Failed to create user");
          }

          await tx.insert(profiles).values({
            userId: user.id,
          });

          return user.id;
        });
      } catch (error) {

        if (isUniqueViolation(error)) {
          throw new AccountAlreadyExistsError();
        }
        throw error;
      }
    },

  };
}
