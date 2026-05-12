import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../../server/trpc/router";
import { createContextFromRequest } from "../../server/trpc/context";

export const config = {
  runtime: "edge",
};

export default function handler(request: Request): Promise<Response> {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: () => createContextFromRequest(request),
  });
}
