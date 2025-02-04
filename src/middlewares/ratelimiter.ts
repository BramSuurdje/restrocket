import { formatResponse } from "@/lib/response";
import type { MiddlewareHandler } from "hono";
import { getConnInfo } from "hono/bun";
import { StatusCodes } from "http-status-codes";
import Redis from "ioredis";
import { RateLimiterRedis } from "rate-limiter-flexible";

const client = new Redis(
	`rediss://default:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
);

const rateLimiter = new RateLimiterRedis({
	storeClient: client,
	points: Number(process.env.RATE_LIMITER_POINTS), // requests allowed
	duration: Number(process.env.RATE_LIMITER_DURATION), // in seconds
});

export const rateLimiterMiddleware: MiddlewareHandler = async (c, next) => {
	if (process.env.NODE_ENV !== "production") return next();

	const info = getConnInfo(c);
	const ip = info.remote.address ?? "127.0.0.1";

	const limiter = await rateLimiter
		.consume(ip)
		.then((limiter) => {
			c.header("Retry-After", String(limiter.msBeforeNext / 1000));
			c.header(
				"X-RateLimit-Limit",
				String(Number(process.env.RATE_LIMITER_POINTS)),
			); // Using points from rateLimiter config
			c.header("X-RateLimit-Remaining", String(limiter.remainingPoints));
			c.header(
				"X-RateLimit-Reset",
				new Date(Date.now() + limiter.msBeforeNext).toUTCString(),
			);
			return next();
		})
		.catch((limiter) => {
			return formatResponse(
				{
					status: "too many requests, please try again later",
					timestamp: new Date().toISOString(),
					ip,
					retryAfter: limiter.msBeforeNext / 1000,
				},
				c.req.header("accept"),
				StatusCodes.TOO_MANY_REQUESTS,
			);
		});

	return limiter;
};
