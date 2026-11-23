
import { afterAll, describe, expect, it } from "vitest";
import { buildApp } from "../../src/app.js";

const app = buildApp();

afterAll(async () => {
  await app.close();
});

describe("POST /auth/login validation", () => {
  it("rejects invalid email", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "invalid-email",
        password: "TestPassword123!",
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it("rejects missing password", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "user@example.com",
      },
    });

    expect(response.statusCode).toBe(400);
  });
});
