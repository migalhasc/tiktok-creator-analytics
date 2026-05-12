import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { defaultRange, defaultSort, searchRangeValues, sortKeyValues } from "@shared/domain";
import { InvalidProfileInputError, normalizeProfileInput } from "@shared/profile-input";
import { assertWithinRateLimit } from "../domain/request-throttle";
import { TikTokIngestService } from "../domain/ingest-service";
import { translateProviderError } from "../domain/provider-errors";
import { publicProcedure, router } from "./trpc";

const dashboardInputSchema = z.object({
  range: z.enum(searchRangeValues).default(defaultRange),
  sort: z.enum(sortKeyValues).default(defaultSort),
});

const service = new TikTokIngestService();

function mapUnknownError(error: unknown): never {
  if (error instanceof InvalidProfileInputError) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: error.message,
    });
  }

  const translated = translateProviderError(error);
  throw new TRPCError({
    code:
      translated.httpStatus === 404
        ? "NOT_FOUND"
        : translated.httpStatus === 403
          ? "FORBIDDEN"
          : translated.httpStatus === 400
            ? "BAD_REQUEST"
          : translated.httpStatus === 429
            ? "TOO_MANY_REQUESTS"
            : translated.httpStatus === 504
              ? "TIMEOUT"
              : "INTERNAL_SERVER_ERROR",
    message: translated.publicMessage,
  });
}

export const appRouter = router({
  searchOrGetProfileDashboard: publicProcedure
    .input(
      dashboardInputSchema.extend({
        profileInput: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      assertWithinRateLimit(`search:${ctx.ip}`, 12, 60_000);

      try {
        return await service.searchOrGetProfileDashboard({
          profileInput: input.profileInput,
          range: input.range,
          sort: input.sort,
          source: "search",
        });
      } catch (error) {
        mapUnknownError(error);
      }
    }),

  getProfileDashboard: publicProcedure
    .input(
      dashboardInputSchema.extend({
        username: z.string().min(1),
      }),
    )
    .query(async ({ input }) => {
      try {
        const normalized = normalizeProfileInput(input.username);
        return await service.getProfileDashboard({
          username: normalized.username,
          range: input.range,
          sort: input.sort,
        });
      } catch (error) {
        mapUnknownError(error);
      }
    }),

  refreshProfile: publicProcedure
    .input(
      z.object({
        username: z.string().min(1),
        force: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      assertWithinRateLimit(`refresh:${ctx.ip}`, 6, 60_000);

      try {
        const normalized = normalizeProfileInput(input.username);
        return await service.refreshProfile({
          username: normalized.username,
          source: input.force ? "manual-refresh" : "auto-refresh",
          force: input.force ?? false,
        });
      } catch (error) {
        mapUnknownError(error);
      }
    }),
});

export type AppRouter = typeof appRouter;
