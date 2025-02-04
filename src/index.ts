import { Hono } from "hono";
import { cors } from "hono/cors";
import { StatusCodes } from "http-status-codes";
import { serveEmojiFavicon } from "stoker/middlewares";
import { getRouteKey, routeNames } from "./config/routes";
import type { auth } from "./lib/auth";
import { formatResponse } from "./lib/response";
import { loggerMiddleware } from "./middlewares/logger";
import prisma from "./lib/prisma";
import * as Schemas from "./prisma";
import type { ZodSchema } from "zod";

type PrismaModels = Exclude<
	keyof typeof prisma,
	| symbol
	| "$on"
	| "$connect"
	| "$disconnect"
	| "$use"
	| "$transaction"
	| "$extends"
>;

const app = new Hono<{
	Variables: {
		user: typeof auth.$Infer.Session.user | null;
		session: typeof auth.$Infer.Session.session | null;
	};
}>()
	.use(loggerMiddleware)
	.use(serveEmojiFavicon("🚀"));

app.notFound((c) => {
	const header = c.req.header("accept");

	return formatResponse(
		{
			status: "not found",
			timestamp: new Date().toISOString(),
		},
		header,
		StatusCodes.NOT_FOUND,
	);
});

app.get("/api/health", (c) => {
	const header = c.req.header("accept");

	return formatResponse(
		{
			status: "ok",
			timestamp: new Date().toISOString(),
		},
		// header,
	);
});

app.on(["GET", "POST"], "/api/v1/:route", async (c) => {
	const header = c.req.header("accept");
	const route = c.req.param("route") as PrismaModels;
	const method = c.req.method;

	if (!routeNames.includes(route as string)) {
		return c.notFound();
	}

	switch (method) {
		case "GET": {
			const page = Number(c.req.query("page")) || 1;
			const limit = Number(c.req.query("limit")) || 10;
			const modelKey = getRouteKey(route);

			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const model = prisma[modelKey as keyof typeof prisma] as any;

			// Get total count for pagination
			const total = await model.count();
			const totalPages = Math.ceil(total / limit);

			const data = await model.findMany({
				skip: (page - 1) * limit,
				take: limit,
			});

			return formatResponse(
				{
					data,
					totalItems: total,
					currentPage: page,
					itemsPerPage: limit,
					totalPages: Math.ceil(total / (limit ?? 10)),
					hasNextPage: page < totalPages,
					hasPreviousPage: page > 1,
				},
				header,
			);
		}
		// Create a new resource
		case "POST": {
			const body = await c.req.json();
			const routeKey = getRouteKey(route);

			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const model = prisma[routeKey as keyof typeof prisma] as any;

			// get the proper zod schema for the route
			const schemaName = `${routeKey}CreateInputSchema` as keyof typeof Schemas;
			const schema = Schemas[schemaName] as ZodSchema;

			// parse the request body with the zod schema
			const parsedBody = schema.safeParse(body);

			if (!parsedBody.success) {
				return formatResponse(
					{ status: "error", message: parsedBody.error.message },
					header,
					StatusCodes.BAD_REQUEST,
				);
			}

			const data = await model.create({
				data: parsedBody.data,
			});

			if (!data) {
				return formatResponse(
					{ status: "error", message: "Failed to create resource" },
					header,
					StatusCodes.INTERNAL_SERVER_ERROR,
				);
			}

			return formatResponse(data, header, StatusCodes.CREATED);
		}
		default:
			return c.notFound();
	}
});

app.on(["GET", "PUT", "PATCH", "DELETE"], "/api/v1/:route/:id", async (c) => {
	const header = c.req.header("accept");
	const route = c.req.param("route");
	const id = c.req.param("id");
	const method = c.req.method;


	if (!routeNames.includes(route)) {
		return c.notFound();
	}

});

app.use(
	"/api/auth/**", // or replace with "*" to enable cors for all routes
	cors({
		origin: process.env.BETTER_AUTH_URL || "http://localhost:3000", // replace with your origin
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["POST", "GET", "OPTIONS"],
		exposeHeaders: ["Content-Length"],
		maxAge: 600,
		credentials: true,
	}),
);

// app.get("/api/session", async (c) => {
// 	const session = c.get("session");
// 	const user = c.get("user");

// 	if (!user) return c.body(null, 401);

// 	return c.json({
// 		session,
// 		user,
// 	});
// });

export default app;
