import { Hono } from "hono";
import { cors } from "hono/cors";
import { StatusCodes } from "http-status-codes";
import { serveEmojiFavicon } from "stoker/middlewares";
import { API_PREFIX } from "./config/constants";
import {
	handleCollectionGet,
	handleCollectionPost,
	handleResourceDelete,
	handleResourceGet,
	handleResourceUpdate,
} from "./controllers/resource.controller";
import env from "./env";
import type { auth } from "./lib/auth";
import { formatResponse } from "./lib/response";
import { authMiddleware } from "./middlewares/auth";
import { loggerMiddleware } from "./middlewares/logger";
import { routeValidationMiddleware } from "./middlewares/route";
import type { AppContext } from "./types";

// Initialize Hono app
const app = new Hono<{
	strict: false;
	Variables: {
		user: typeof auth.$Infer.Session.user | null;
		session: typeof auth.$Infer.Session.session | null;
	};
}>();

// Apply global middlewares
app
	.use(loggerMiddleware)
	.use(serveEmojiFavicon("🚀"))
	.use(`${API_PREFIX}/:route`, routeValidationMiddleware)
	.use(`${API_PREFIX}/:route/:id`, routeValidationMiddleware)
	.use(`${API_PREFIX}/*`, authMiddleware);

// Global 404 handler
app.notFound((c) => {
	const header = c.req.header("accept");
	return formatResponse(
		{
			status: "the route you are looking for does not exist",
			timestamp: new Date().toISOString(),
			route: c.req.param("route"),
		},
		header,
		StatusCodes.NOT_FOUND,
	);
});

// Health check endpoint
app.get("/api/health", (c) => {
	const header = c.req.header("accept");
	return formatResponse(
		{
			status: "ok",
			timestamp: new Date().toISOString(),
		},
		header,
	);
});

// Collection endpoints (GET, POST)
app.on(["GET", "POST"], `${API_PREFIX}/:route`, async (c) => {
	const route = c.req.param("route");

	switch (c.req.method) {
		case "GET":
			return handleCollectionGet(c as AppContext, route);
		case "POST":
			return handleCollectionPost(c as AppContext, route);
		default:
			return c.notFound();
	}
});

// Resource endpoints (GET, PUT, PATCH, DELETE)
app.on(
	["GET", "PUT", "PATCH", "DELETE"],
	`${API_PREFIX}/:route/:id`,
	async (c) => {
		const route = c.req.param("route");
		const id = c.req.param("id");

		switch (c.req.method) {
			case "GET":
				return handleResourceGet(c as AppContext, route, id);
			case "PUT":
			case "PATCH":
				return handleResourceUpdate(c as AppContext, route, id, c.req.method);
			case "DELETE":
				return handleResourceDelete(c as AppContext, route, id);
			default:
				return c.notFound();
		}
	},
);

// CORS configuration for auth routes
app.use(
	"/api/auth/**",
	cors({
		origin: env.BETTER_AUTH_URL || "http://localhost:3000",
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["POST", "GET", "OPTIONS"],
		exposeHeaders: ["Content-Length"],
		maxAge: 600,
		credentials: true,
	}),
);

// Global error handler
app.onError((err, c) => {
	const header = c.req.header("accept");
	console.error(`[Error] ${err.message}`);

	return formatResponse(
		{
			status: "error",
			message: "Internal Server Error",
			error: env.NODE_ENV === "development" ? err.message : undefined,
		},
		header,
		StatusCodes.INTERNAL_SERVER_ERROR,
	);
});

export default app;
