import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { appRouter } from "./trpc/router";
import { createContextFromHeaders } from "./trpc/context";

const server = createHTTPServer({
  basePath: "/api/trpc/",
  router: appRouter,
  createContext({ req }) {
    return createContextFromHeaders(req.headers as HeadersInit);
  },
});

server.listen(4000);
console.log("tRPC dev server listening on http://localhost:4000");
