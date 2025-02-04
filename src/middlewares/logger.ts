import type { MiddlewareHandler } from "hono";
import { pinoLogger } from "hono-pino";
import pino from "pino";

export const loggerMiddleware: MiddlewareHandler = pinoLogger({
	pino: pino(
		process.env.NODE_ENV === "production"
			? undefined
			: {
					transport: {
						target: "pino-pretty",
						options: {
							colorize: true,
						},
					},
				},
	),
	http: {
		reqId: () => crypto.randomUUID(),
	},
});
