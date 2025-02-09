import type { Context } from "hono";
import { StatusCodes } from "http-status-codes";
import type { ZodSchema } from "zod";
import { formatResponse } from "../lib/response";
import type { PaginationParams, QueryParams } from "../types";

/**
 * Helper function to get pagination parameters from request
 */
export const getPaginationParams = (c: Context): PaginationParams => ({
	page: Number(c.req.query("page")) || 1,
	limit: Number(c.req.query("limit")) || 10,
});

/**
 * Helper function to get query parameters from request
 */
export const getQueryParams = (c: Context): QueryParams => ({
	...getPaginationParams(c),
	sortBy: c.req.query("sortBy"),
	sortOrder: c.req.query("sortOrder") as "asc" | "desc",
	filter: c.req.query("filter")
		? (JSON.parse(c.req.query("filter") as string) as Record<string, unknown>)
		: undefined,
});

/**
 * Add cache control headers for GET requests
 */
export const addCacheHeaders = (c: Context, maxAge = 60) => {
	c.header("Cache-Control", `public, max-age=${maxAge}`);
	c.header("ETag", Date.now().toString());
};

/**
 * Validate request body against a schema
 */
export const validateRequest = async (c: Context, schema: ZodSchema) => {
	try {
		const body = await c.req.json();
		const parsed = schema.safeParse(body);

		if (!parsed.success) {
			return formatResponse(
				{ status: "error", message: parsed.error.message },
				c.req.header("accept"),
				StatusCodes.BAD_REQUEST,
			);
		}

		return parsed.data;
	} catch (error) {
		return formatResponse(
			{ status: "error", message: "Invalid JSON body" },
			c.req.header("accept"),
			StatusCodes.BAD_REQUEST,
		);
	}
};
