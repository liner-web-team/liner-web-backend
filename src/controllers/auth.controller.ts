
import type { FastifyRequest, FastifyReply } from "fastify";
import type { LoginInput, SessionResponse, RegisterInput } from "../shared/contracts/auth.js";
import type { AppDependencies } from "../composition/container.js";

export class AuthController {
    constructor(
        private readonly dependencies: Pick<AppDependencies, "authService">,
    ) { }

    async login(
        request: FastifyRequest<{ Body: LoginInput }>,
        reply: FastifyReply,
    ) {
        const result = await this.dependencies.authService.login(request.body);

        reply.setCookie("refreshToken", result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/auth",
            expires: result.refreshTokenExpiresAt,
        });

        const response: SessionResponse = {
            accessToken: result.accessToken,
            accessTokenExpiresAt: result.accessTokenExpiresAt,
            user: {
                id: result.userId,
            },
        };

        return reply.code(200).send(response);
    }

    async register(
        request: FastifyRequest<{ Body: RegisterInput }>,
        reply: FastifyReply,
    ) {
        const result = await this.dependencies.authService.register(
            request.body,
        );

        return reply.code(201).send(result);
    }


}
