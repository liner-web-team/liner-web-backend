
import type { FastifyPluginAsync } from "fastify";
import type { LoginInput, RegisterInput } from "../shared/contracts/auth.js";

export const authRoutes: FastifyPluginAsync = async (app) => {
    app.post<{ Body: LoginInput }>(
        "/login",
        {

            schema: {
                body: {
                    type: "object",
                    required: ["email", "password"],
                    additionalProperties: false,
                    properties: {
                        email: {
                            type: "string",
                            format: "email",
                            minLength: 3,
                            maxLength: 254,
                        },
                        password: {
                            type: "string",
                            minLength: 1,
                            maxLength: 256,
                        },
                    },
                },
            },

        },
        async (request, reply) => {
            const controller = request.diScope.resolve("authController");
            return controller.login(request, reply);
        },
    );


    app.post<{ Body: RegisterInput }>(
        "/register",
        {
            schema: {
                body: {
                    type: "object",
                    required: [
                        "email",
                        "password",
                        "username",
                        "displayName",
                    ],
                    additionalProperties: false,
                    properties: {
                        email: {
                            type: "string",
                            format: "email",
                            minLength: 3,
                            maxLength: 254,
                        },
                        password: {
                            type: "string",
                            minLength: 8,
                            maxLength: 256,
                        },
                        username: {
                            type: "string",
                            minLength: 1,
                        },
                        displayName: {
                            type: "string",
                            minLength: 1,
                        },
                    },
                },
            },
        },
        async (request, reply) => {
            const controller = request.diScope.resolve("authController");
            return controller.register(request, reply);
        },
    );

};
