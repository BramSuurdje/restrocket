import * as path from "node:path";
/* eslint-disable node/no-process-env */
import { config } from "dotenv";
import { expand } from "dotenv-expand";
import { z } from "zod";

expand(
	config({
		path: path.resolve(
			process.cwd(),
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

// eslint-disable-next-line ts/no-redeclare
const { data: env, error } = EnvSchema.safeParse(process.env);

if (error) {
	console.error("❌ Invalid env:");
	console.error(JSON.stringify(error.flatten().fieldErrors, null, 2));
	process.exit(1);
}

// biome-ignore lint/style/noNonNullAssertion: <explanation>
export default env!;
