import { StatusCodes } from "http-status-codes";
import type { ZodSchema } from "zod";
import type * as z from "zod";
import { getRouteKey, routeNames } from "../config/routes";
import prisma from "../lib/prisma";
import { formatResponse } from "../lib/response";
import * as Schemas from "../prisma";
import type { AppContext, PrismaModel } from "../types";
import {
	addCacheHeaders,
	getQueryParams,
	validateRequest,
} from "../utils/request";

/**
 * Handle GET request for collection
 */
export const handleCollectionGet = async (c: AppContext, route: string) => {
	const header = c.req.header("accept");
	const modelKey = getRouteKey(route);
	const model = prisma[modelKey as keyof typeof prisma] as PrismaModel;

	addCacheHeaders(c);
	const { page, limit, sortBy, sortOrder, filter } = getQueryParams(c);

	const [total, data] = await Promise.all([
		model.count({ where: filter }),
		model.findMany({
			skip: (page - 1) * limit,
			take: limit,
			orderBy: sortBy ? { [sortBy]: sortOrder || "asc" } : undefined,
			where: filter,
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
};

/**
 * Handle POST request for collection
 */
export const handleCollectionPost = async (c: AppContext, route: string) => {
	const header = c.req.header("accept");
	const modelKey = getRouteKey(route);
	const model = prisma[modelKey as keyof typeof prisma] as PrismaModel;

	const schemaName = `${modelKey}CreateInputSchema` as keyof typeof Schemas;
	const schema = Schemas[schemaName] as ZodSchema;

	const validatedData = await validateRequest(c, schema);
	if ("status" in validatedData && validatedData.status === "error") {
		return validatedData;
	}

	try {
		const data = await model.create({
			data: validatedData,
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
};

/**
 * Handle GET request for single resource
 */
export const handleResourceGet = async (
	c: AppContext,
	route: string,
	id: string,
) => {
	const header = c.req.header("accept");
	const modelKey = getRouteKey(route);
	const model = prisma[modelKey as keyof typeof prisma] as PrismaModel;

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

	addCacheHeaders(c);
	return formatResponse(resource, header);
};

/**
 * Handle PUT/PATCH request for single resource
 */
export const handleResourceUpdate = async (
	c: AppContext,
	route: string,
	id: string,
	method: "PUT" | "PATCH",
) => {
	const header = c.req.header("accept");
	const modelKey = getRouteKey(route);
	const model = prisma[modelKey as keyof typeof prisma] as PrismaModel;

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

	const schemaName = `${modelKey}UpdateInputSchema` as keyof typeof Schemas;
	// biome-ignore lint/suspicious/noExplicitAny: Prisma schema type
	const schema = Schemas[schemaName] as z.ZodObject<any>;
	const validationSchema = method === "PATCH" ? schema.partial() : schema;

	const validatedData = await validateRequest(c, validationSchema);
	if ("status" in validatedData && validatedData.status === "error") {
		return validatedData;
	}

	try {
		const updatedData = await model.update({
			where: { id },
			data: validatedData,
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
};

/**
 * Handle DELETE request for single resource
 */
export const handleResourceDelete = async (
	c: AppContext,
	route: string,
	id: string,
) => {
	const header = c.req.header("accept");
	const modelKey = getRouteKey(route);
	const model = prisma[modelKey as keyof typeof prisma] as PrismaModel;

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
};
