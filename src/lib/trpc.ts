import { QueryClient } from "@tanstack/react-query";
import { createTRPCProxyClient, httpLink } from "@trpc/client";
import type { AppRouter } from "../../server/trpc/router";
import { defaultRange, defaultSort, type SearchRange, type SortKey } from "@shared/domain";

function getTrpcUrl(): string {
  if (import.meta.env.PROD) {
    return "/api/trpc";
  }

  return "/api/trpc";
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpLink({
      url: getTrpcUrl(),
    }),
  ],
});

export const dashboardQueryKey = (username: string, range: SearchRange = defaultRange, sort: SortKey = defaultSort) =>
  ["dashboard", username, range, sort] as const;

export const dashboardQueryPrefix = (username: string) => ["dashboard", username] as const;
