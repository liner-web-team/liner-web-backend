# ========================================================
# Stage 1: Build stage (компиляция TypeScript и подготовка)
# ========================================================
FROM node:24-alpine AS builder

WORKDIR /app

# Активируем corepack для гарантированной версии pnpm (12.18.0)
RUN corepack enable && corepack prepare pnpm@12.18.0 --activate

# Копируем файлы зависимостей для эффективного кэширования слоёв
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./

# Устанавливаем зависимости строго по зафиксированному lock-файлу
RUN pnpm install --frozen-lockfile

# Копируем конфигурацию TypeScript и исходный код
COPY tsconfig.json ./
COPY src/ ./src/

# Компилируем TypeScript-код в директорию ./dist
RUN pnpm build

# Очищаем devDependencies, оставляя только зависимости для production
RUN pnpm prune --prod

# ========================================================
# Stage 2: Production runner (минимальный образ без root)
# ========================================================
FROM node:24-alpine AS runner

WORKDIR /app

# Переменные окружения для работы в контейнере
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

# Копируем из builder-стадии только то, что нужно для работы сервера
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist

# Безопасность (Hardening): запуск от непривилегированного пользователя node (UID 1000)
USER node

# Открываем рабочий порт приложения
EXPOSE 3000

# Встроенный healthcheck для проверки состояния сервиса
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/health || exit 1

# Точка входа — запуск скомпилированного сервера
CMD ["node", "dist/server.js"]
