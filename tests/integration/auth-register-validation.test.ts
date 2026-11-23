
import { afterAll, describe, expect, it } from "vitest";
import { buildApp } from "../../src/app.js";

const app = buildApp();

afterAll(async () => {
  await app.close();
});

describe("POST /auth/register validation", () => {
  it("rejects password shorter than 8 characters", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: {
        email: "test@example.com",
        password: "1234567",
        username: "testuser",
        displayName: "Test User",
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it("rejects registration without username", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: {
        email: "test@example.com",
        password: "12345678",
        displayName: "Test User",
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it("rejects password longer than 256 characters", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: {
        email: "test@example.com",
        password: "a".repeat(257),
        username: "testuser",
        displayName: "Test User",
      },
    });

    expect(response.statusCode).toBe(400);
  });
});
