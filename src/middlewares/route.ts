import { routeNames } from "@/config/routes";
import { createMiddleware } from "hono/factory";

export const routeValidationMiddleware = createMiddleware(async (c, next) => {
	const route = c.req.param("route");

	if (!route || !routeNames.includes(route)) {
		return c.notFound();
	}

	await next();
});
