/*
  This file contains the route configurations for the application.
  It is used to define the routes and their permissions for each role.
  New routes can be added here in a type safe manner. if the model does not exist in the prisma schema,
  the route cannot be created.
*/

export const routeConfigurations: RouteConfigInputType = {
	Post: { routeName: "post" },
} as const;

/**
 * Configurations
 */

import type { Prisma } from "@prisma/client";
import type * as Schemas from "../lib/prisma";

// Add RouteConfig export
export interface RouteConfig {
	routeName: string;
}

export type PrismaModels = Prisma.ModelName;
export type RouteName = Lowercase<PrismaModels>;
export type SchemaKey = keyof typeof Schemas;
export type RouteConfigType = Partial<Record<PrismaModels, RouteConfig>>;

// get an arrray of all the route names
export const routeNames = Object.values(routeConfigurations).map(
	(route) => route.routeName,
);

// get the associated route key with the route name
export const getRouteKey = (routeName: string) => {
	return Object.keys(routeConfigurations).find(
		(key) =>
			routeConfigurations[key as keyof typeof routeConfigurations]
				?.routeName === routeName,
	);
};

export type RouteConfigInputType = Partial<
	Record<PrismaModels, Omit<RouteConfig, "schema">>
>;
