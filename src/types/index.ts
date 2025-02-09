import type prisma from "@/lib/prisma";
import type { Context } from "hono";
import type { auth } from "../lib/auth";

// Define types for Prisma models, excluding internal Prisma methods
export type PrismaModels = Exclude<
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
export interface PaginationParams {
	page: number;
	limit: number;
}

// Add sorting and filtering support to GET endpoints
export interface QueryParams extends PaginationParams {
	sortBy?: string;
	sortOrder?: "asc" | "desc";
	filter?: Record<string, unknown>;
}

// App context type
export type AppContext = Context<{
	strict: false;
	Variables: {
		user: typeof auth.$Infer.Session.user | null;
		session: typeof auth.$Infer.Session.session | null;
	};
}>;

// Prisma model type
export type PrismaModel = {
	count: (args?: { where?: Record<string, unknown> }) => Promise<number>;
	// biome-ignore lint/suspicious/noExplicitAny: Prisma client
	findMany: (args: any) => Promise<any[]>;
	// biome-ignore lint/suspicious/noExplicitAny: Prisma client
	create: (args: any) => Promise<any>;
	// biome-ignore lint/suspicious/noExplicitAny: Prisma client
	update: (args: any) => Promise<any>;
	// biome-ignore lint/suspicious/noExplicitAny: Prisma client
	delete: (args: any) => Promise<any>;
	// biome-ignore lint/suspicious/noExplicitAny: Prisma client
	findUnique: (args: any) => Promise<any>;
};
