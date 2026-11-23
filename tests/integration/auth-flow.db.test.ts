
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

import { buildApp } from "../../src/app.js";
import { createDatabase } from "../../src/db/postgres.connection.js";
import { env } from "../../src/config/env.js";

describe("Auth flow with Neon PostgreSQL", () => {
  it.skipIf(process.env.RUN_NEON_AUTH_TEST !== "1")(
    "registers a user and logs in",
    async () => {
      if (!env.databaseUrl) {
        throw new Error("DATABASE_URL is required");
      }

      if (process.env.NODE_ENV === "production") {
        throw new Error("Cannot run database tests in production");
      }

      const { sql } = createDatabase();
      const app = buildApp({}, { enableDatabase: true });

      const testId = randomUUID().replaceAll("-", "");
      const email = `auth-${testId}@example.com`;
      const username = `auth_${testId.slice(0, 12)}`;
      const password = `Test-${randomUUID()}`;

      try {
        const registration = await app.inject({
          method: "POST",
          url: "/auth/register",
          payload: {
            email,
            password,
            username,
            displayName: "Auth Test",
          },
        });

        expect(registration.statusCode).toBe(201);

        const { userId } = registration.json();

        expect(userId).toEqual(expect.any(String));

        const login = await app.inject({
          method: "POST",
          url: "/auth/login",
          payload: {
            email,
            password,
          },
        });

        expect(login.statusCode).toBe(200);

        const result = login.json();

        expect(result.user.id).toBe(userId);
        expect(result.accessToken).toEqual(expect.any(String));

        expect(String(login.headers["set-cookie"]))
          .toContain("refreshToken=");
      } finally {
        try {
          await sql`
            DELETE FROM account.sessions
            WHERE user_id IN (
              SELECT id FROM account.users
              WHERE email_normalized = ${email}
            )
          `;

          await sql`
            DELETE FROM account.users
            WHERE email_normalized = ${email}
          `;
        } finally {
          try {
            await app.close();
          } finally {
            await sql.end();
          }
        }
      }
    },
  );
});
