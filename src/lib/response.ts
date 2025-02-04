import { XMLConfig } from "@/config/xml";
import { StatusCodes } from "http-status-codes";
import { toXML } from "jstoxml";

export const formatResponse = (
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	data: any,
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
