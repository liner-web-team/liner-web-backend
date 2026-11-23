/**
 * Контейнер зависимостей приложения (Dependency Injection).
 *
 * Создаёт и настраивает контейнер Awilix, который управляет
 * созданием объектов и внедрением зависимостей между слоями
 * Controllers, Services, Repositories и Integrations.
 *
 * Конкретные зависимости регистрируются отдельно.
 */

import { createContainer, InjectionMode } from "awilix";
import type { AxiosInstance } from "axios";
import type { createDatabase } from "../db/postgres.connection.js";
import type { createAuthRepository } from "../repositories/auth.repository.js";
import type { createAuthService } from "../services/auth.service.js";
import type { SessionRepository } from "../interfaces/session-repository.interface.js";
import type { AuthController } from "../controllers/auth.controller.js";

export interface AppDependencies {
  catalogClient: AxiosInstance;
  lyricsClient: AxiosInstance;
  db?: ReturnType<typeof createDatabase>["db"],
  authRepository: ReturnType<typeof createAuthRepository>;
  authService: ReturnType<typeof createAuthService>;
  sessionRepository: SessionRepository;
  authController: AuthController;
}

export function createDependencyContainer() {
  return createContainer<AppDependencies>({
    injectionMode: InjectionMode.PROXY,//PROXY позволит передавать зависимости по именам через объект
    strict: true,//дополнительные проверки корректности жизненных циклов зависимостей
  });
}

export type DependencyContainer =
  ReturnType<typeof createDependencyContainer>;

declare module "@fastify/awilix" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Cradle extends AppDependencies { }
}