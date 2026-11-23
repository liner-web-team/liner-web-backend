/**
 * Регистрация зависимостей приложения в контейнере Awilix.
 *
 * Связывает имена зависимостей с конкретными реализациями.
 * Клиенты создаются по требованию, а не при запуске сервера.
 */

import { asClass, asFunction, type NameAndRegistrationPair } from "awilix";
import type { AppDependencies } from "./container.js";
import type { DependencyContainer } from "./container.js";
import { createCatalogClient } from "../integrations/liner/catalog.client.js";
import { createLyricsClient } from "../integrations/liner/lyrics.client.js";
import { createAuthRepository } from "../repositories/auth.repository.js";
import { createAuthService } from "../services/auth.service.js";
import { createSessionRepository } from "../repositories/session.repository.js";
import { AuthController } from "../controllers/auth.controller.js";

export function registerDependencies(
    container: DependencyContainer,
): void {
    const registrations = {
        catalogClient: asFunction(() => createCatalogClient()).singleton(),

        lyricsClient: asFunction(() => createLyricsClient()).singleton(),

        authRepository: asFunction(({ db }: AppDependencies) => {
            if (!db) {
                throw new Error("Database is not initialized");
            }
            return createAuthRepository(db);
        }).scoped(),

        authService: asFunction(
            ({ authRepository, sessionRepository }: AppDependencies) =>
                createAuthService(authRepository, sessionRepository),
        ).scoped(),

        sessionRepository: asFunction(({ db }: AppDependencies) => {
            if (!db) {
                throw new Error("Database is not initialized");
            }

            return createSessionRepository(db);
        }).scoped(),

        authController: asClass(AuthController).scoped(),

    } satisfies NameAndRegistrationPair<AppDependencies>;


    container.register(registrations);
}
