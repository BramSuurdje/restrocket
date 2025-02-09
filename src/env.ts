/**
 * This file is used to load the environment variables.
 * It is only allowed to use process.env in this file.
 * in the app, you should import env from this file.
 * its a type-safe way to access the environment variables.
 */

import * as path from "node:path";
import { config } from "dotenv";
import { expand } from "dotenv-expand";
import { z } from "zod";

expand(
	config({
		path: path.resolve(
			process.cwd(),
			// biome-ignore lint/nursery/noProcessEnv: process.env is only allowed in env.ts
			process.env.NODE_ENV === "test" ? ".env.test" : ".env",
		),
	}),
);

const EnvSchema = z.object({
	NODE_ENV: z.string().default("development"),
	PORT: z.coerce.number().default(3000),
	LOG_LEVEL: z.enum([
		"fatal",
		"error",
		"warn",
		"info",
		"debug",
		"trace",
		"silent",
	]),
	DATABASE_URL: z.string().url(),
	BETTER_AUTH_SECRET: z.string(),
	BETTER_AUTH_URL: z.string().url(),
	REDIS_STRING: z.string(),
	RATE_LIMITER_POINTS: z.coerce.number(),
	RATE_LIMITER_DURATION: z.coerce.number(),
});

export type env = z.infer<typeof EnvSchema>;

// biome-ignore lint/nursery/noProcessEnv: process.env is only allowed in env.ts
const { data: env, error } = EnvSchema.safeParse(process.env);

if (error) {
	console.error("❌ Invalid env:");
	console.error(JSON.stringify(error.flatten().fieldErrors, null, 2));
	process.exit(1);
}

// biome-ignore lint/style/noNonNullAssertion: env is not undefined
export default env!;
