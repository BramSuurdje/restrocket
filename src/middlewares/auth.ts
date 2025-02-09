import { auth } from "@/lib/auth";
import { formatResponse } from "@/lib/response";
import { createMiddleware } from "hono/factory";
import { StatusCodes } from "http-status-codes";

export const authMiddleware = createMiddleware(async (c, next) => {
	const session = await auth.api.getSession({
		headers: c.req.raw.headers,
	});

	if (!session?.session) {
		return formatResponse(
			{
				status: "unauthorized",
				message: "You are not authorized to access this resource",
			},
			c.req.header("accept"),
			StatusCodes.UNAUTHORIZED,
		);
	}

	c.set("session", session.session);
	c.set("user", session.user);

	await next();
});
