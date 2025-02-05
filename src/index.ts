import { Hono } from "hono";
import { cors } from "hono/cors";
import { StatusCodes } from "http-status-codes";
import { serveEmojiFavicon } from "stoker/middlewares";
import type { ZodSchema } from "zod";
import type * as z from "zod";
import { getRouteKey, routeNames } from "./config/routes";
import type { auth } from "./lib/auth";
import prisma from "./lib/prisma";
import { formatResponse } from "./lib/response";
import { loggerMiddleware } from "./middlewares/logger";
import { rateLimiterMiddleware } from "./middlewares/ratelimiter";
import * as Schemas from "./prisma";
import env from "./env";

// Define types for Prisma models, excluding internal Prisma methods
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

// Type for pagination parameters
interface PaginationParams {
	page: number;
	limit: number;
}

// Initialize Hono app with type-safe session variables
const app = new Hono<{
	Variables: {
		user: typeof auth.$Infer.Session.user | null;
		session: typeof auth.$Infer.Session.session | null;
	};
}>()
	.use(loggerMiddleware)
	.use(serveEmojiFavicon("🚀"))
	.use("*", rateLimiterMiddleware);

/**
 * Global 404 handler
 */
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

/**
 * Health check endpoint
 */
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

/**
 * Helper function to get pagination parameters from request
 */

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const getPaginationParams = (c: any): PaginationParams => ({
	page: Number(c.req.query("page")) || 1,
	limit: Number(c.req.query("limit")) || 10,
});

/**
 * Collection endpoints for GET (list) and POST (create) operations
 */
app.on(["GET", "POST"], "/api/v1/:route", async (c) => {
	const header = c.req.header("accept");
	const route = c.req.param("route") as PrismaModels;
	const method = c.req.method;

	// Validate route exists
	if (!routeNames.includes(route as string)) {
		return c.notFound();
	}

	// Get Prisma model for the route
	const modelKey = getRouteKey(route);
	// biome-ignore lint/suspicious/noExplicitAny: Prisma models require any type
	const model = prisma[modelKey as keyof typeof prisma] as any;

	switch (method) {
		case "GET": {
			const { page, limit } = getPaginationParams(c);

			// Execute count and data fetch in parallel for better performance
			const [total, data] = await Promise.all([
				model.count(),
				model.findMany({
					skip: (page - 1) * limit,
					take: limit,
				}),
			]);

			const totalPages = Math.ceil(total / limit);

			return formatResponse(
				{
					data,
					totalItems: total,
					currentPage: page,
					itemsPerPage: limit,
					totalPages,
					hasNextPage: page < totalPages,
					hasPreviousPage: page > 1,
				},
				header,
			);
		}

		case "POST": {
			const body = await c.req.json();

			// Get and validate schema for the route
			const schemaName = `${modelKey}CreateInputSchema` as keyof typeof Schemas;
			const schema = Schemas[schemaName] as ZodSchema;
			const parsedBody = schema.safeParse(body);

			if (!parsedBody.success) {
				return formatResponse(
					{ status: "error", message: parsedBody.error.message },
					header,
					StatusCodes.BAD_REQUEST,
				);
			}

			try {
				const data = await model.create({
					data: parsedBody.data,
				});

				return formatResponse(data, header, StatusCodes.CREATED);
			} catch (error) {
				return formatResponse(
					{
						status: "error",
						message: "Failed to create resource",
						error: error instanceof Error ? error.message : "Unknown error",
					},
					header,
					StatusCodes.INTERNAL_SERVER_ERROR,
				);
			}
		}

		default:
			return c.notFound();
	}
});

/**
 * Resource endpoints for GET, PUT, PATCH, and DELETE operations on individual items
 */
app.on(["GET", "PUT", "PATCH", "DELETE"], "/api/v1/:route/:id", async (c) => {
	const header = c.req.header("accept");
	const route = c.req.param("route") as PrismaModels;
	const id = c.req.param("id");
	const method = c.req.method;

	// Validate route exists
	if (!routeNames.includes(route)) {
		return c.notFound();
	}

	const modelKey = getRouteKey(route);
	// biome-ignore lint/suspicious/noExplicitAny: Prisma models require any type
	const model = prisma[modelKey as keyof typeof prisma] as any;

	// First check if resource exists
	const resource = await model.findUnique({
		where: { id },
	});

	if (!resource) {
		return formatResponse(
			{ status: "error", message: "Resource not found" },
			header,
			StatusCodes.NOT_FOUND,
		);
	}

	switch (method) {
		case "GET":
			return formatResponse(resource, header);

		case "PUT":
		case "PATCH": {
			const body = await c.req.json();
			const schemaName = `${modelKey}UpdateInputSchema` as keyof typeof Schemas;
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const schema = Schemas[schemaName] as z.ZodObject<any>;

			// Use partial validation for PATCH, full validation for PUT
			const validationSchema = method === "PATCH" ? schema.partial() : schema;
			const parsedBody = validationSchema.safeParse(body);

			if (!parsedBody.success) {
				return formatResponse(
					{ status: "error", message: parsedBody.error.message },
					header,
					StatusCodes.BAD_REQUEST,
				);
			}

			try {
				const updatedData = await model.update({
					where: { id },
					data: parsedBody.data,
				});

				return formatResponse(updatedData, header);
			} catch (error) {
				return formatResponse(
					{
						status: "error",
						message: "Failed to update resource",
						error: error instanceof Error ? error.message : "Unknown error",
					},
					header,
					StatusCodes.INTERNAL_SERVER_ERROR,
				);
			}
		}

		case "DELETE":
			try {
				await model.delete({
					where: { id },
				});

				return formatResponse(
					{ status: "success", message: "Resource deleted successfully" },
					header,
					StatusCodes.OK,
				);
			} catch (error) {
				return formatResponse(
					{
						status: "error",
						message: "Failed to delete resource",
						error: error instanceof Error ? error.message : "Unknown error",
					},
					header,
					StatusCodes.INTERNAL_SERVER_ERROR,
				);
			}
	}
});

/**
 * CORS configuration for auth routes
 */
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
