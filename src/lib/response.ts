import { XMLConfig } from "@/config/xml";
import { StatusCodes } from "http-status-codes";
import { toXML } from "jstoxml";

interface ResponseData {
	status?: string;
	data?: unknown;
	message?: string;
	timestamp?: string;
	route?: string;
	id?: string;
	totalItems?: number;
	currentPage?: number;
	itemsPerPage?: number;
	totalPages?: number;
	hasNextPage?: boolean;
	hasPreviousPage?: boolean;
}
export const formatResponse = (
	data: ResponseData,
	acceptHeader = "application/json",
	status = StatusCodes.OK,
) => {
	if (acceptHeader.includes("application/xml")) {
		return new Response(toXML({ response: data }, XMLConfig), {
			headers: { "Content-Type": "application/xml" },
			status,
		});
	}

	return new Response(JSON.stringify(data), {
		headers: { "Content-Type": "application/json" },
		status,
	});
};
