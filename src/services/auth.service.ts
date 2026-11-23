
import argon2 from "argon2";

import { AppError } from "../shared/errors/app-error.js";
import type { LoginInput, RegisterInput } from "../shared/contracts/auth.js";
import type { AuthRepository } from "../interfaces/auth-repository.interface.js";
import type { SessionRepository } from "../interfaces/session-repository.interface.js";
import { AccountAlreadyExistsError } from "../shared/errors/account-already-exists.error.js";
import { randomBytes, createHash } from "node:crypto";
import { SignJWT } from "jose";
import { env } from "../config/env.js";

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

export function createAuthService(authRepository: AuthRepository, sessionRepository: SessionRepository) {
  return {
    //ищет пользователя по email, проверяет пароль с помощью Argon2 и возвращает userId при успехе
    async validateCredentials(input: LoginInput) {
      const user = await authRepository.findByEmail(input.email);

      if (!user || !user.passwordHash) {
        throw new AppError(
          "Invalid email or password",
          401,
          "INVALID_CREDENTIALS",
        );
      }

      const passwordValid = await argon2.verify(
        user.passwordHash,
        input.password,
      );

      if (!passwordValid) {
        throw new AppError(
          "Invalid email or password",
          401,
          "INVALID_CREDENTIALS",
        );
      }

      return { userId: user.id };
    },
    //генерирует Refresh Token, вычисляет его SHA-256-хеш,
    // сохраняет сессию через SessionRepository в PostgreSQL и возвращает токен со сроком действия
    async createRefreshSession(userId: string) {
      const refreshToken = randomBytes(32).toString("base64url");

      const tokenHash = createHash("sha256")
        .update(refreshToken)
        .digest("hex");

      const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

      await sessionRepository.createSession({
        userId,
        tokenHash,
        expiresAt,
      });

      return { refreshToken, expiresAt };
    },

    //создаёт подписанный JWT, содержащий идентификатор пользователя и срок действия.
    // Библиотека jose подписывает его с использованием нашего JWT_SECRET
    async createAccessToken(userId: string) {
      if (Buffer.byteLength(env.jwtSecret, "utf8") < 32) {
        throw new Error("JWT_SECRET must be at least 32 bytes");
      }

      const secret = new TextEncoder().encode(env.jwtSecret);

      const issuedAt = Math.floor(Date.now() / 1000);
      const expiresAt = issuedAt + ACCESS_TOKEN_TTL_SECONDS;

      const accessToken = await new SignJWT({})
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(userId)
        .setIssuedAt(issuedAt)
        .setExpirationTime(expiresAt)
        .sign(secret);

      return {
        accessToken,
        accessTokenExpiresAt: new Date(expiresAt * 1000).toISOString(),
      };

    },


    async login(input: LoginInput) {
      // 1. Проверяем email и пароль
      const { userId } = await this.validateCredentials(input);

      // 2. Создаём Access Token
      const { accessToken, accessTokenExpiresAt } =
        await this.createAccessToken(userId);

      // 3. Создаём Refresh Token и сохраняем сессию в БД
      const { refreshToken, expiresAt } =
        await this.createRefreshSession(userId);

      // 4. Возвращаем результат внутри Backend
      return {
        userId,
        accessToken,
        accessTokenExpiresAt,
        refreshToken,
        refreshTokenExpiresAt: expiresAt,
      };
    },


    async register(input: RegisterInput) {
      if (input.password.length < 8 || input.password.length > 256) {
        throw new AppError(
          "Password must be between 8 and 256 characters",
          400,
          "INVALID_PASSWORD",
        );
      }

      const passwordHash = await argon2.hash(input.password, {
        type: argon2.argon2id,
      });

      try {
        const userId = await authRepository.createAccount({
          email: input.email,
          username: input.username,
          displayName: input.displayName,
          passwordHash,
        });

        return { userId };
      } catch (error) {
        if (error instanceof AccountAlreadyExistsError) {
          throw new AppError(
            "Email or username already exists",
            409,
            "ACCOUNT_ALREADY_EXISTS",
          );
        }

        throw error;
      }
    },


  };
}
