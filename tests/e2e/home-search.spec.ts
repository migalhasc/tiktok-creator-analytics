import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

const dashboardPayload = {
  profile: {
    username: "demoprofile",
    displayName: "Demo Profile",
    biography: "Perfil de teste com dados reais simulados para fluxo E2E.",
    profileUrl: "https://www.tiktok.com/@demoprofile",
    avatarUrl: null,
    followers: 120340,
    following: 120,
    likes: 980000,
    videosCount: 84,
    isVerified: false,
  },
  range: "30d",
  sort: "best",
  cacheStatus: "fresh",
  lastUpdatedAt: "2026-05-06T10:00:00.000Z",
  needsRefresh: false,
  periodBoundaries: {
    currentStartDate: "2026-04-07",
    currentEndDate: "2026-05-06",
    previousStartDate: "2026-03-08",
    previousEndDate: "2026-04-06",
  },
  filterAvailability: {
    best: { enabled: true },
    liked: { enabled: true },
    viewed: { enabled: true },
    shared: { enabled: true },
    saved: { enabled: true },
    reposted: { enabled: false, reason: "Reposts já entram agregados em compartilhamentos públicos." },
    commented: { enabled: true },
    tier: { enabled: true },
    topRated: { enabled: true },
  },
  aggregates: {
    postsCount: 3,
    totalViews: 560000,
    totalLikes: 42000,
    totalComments: 1900,
    totalShares: 780,
    totalSaves: 620,
    totalReposts: null,
    totalEngagement: 44680,
    engagementRateByViews: 7.98,
    engagementRateByFollowers: 37.12,
    shareRate: 0.14,
    commentRate: 0.34,
    saveRate: 0.11,
    repostRate: null,
    engagementPer1000Views: 79.8,
    postsPublishedInPeriod: 1,
    postsGrowingInPeriod: 2,
    evergreenPosts: 1,
  },
  lifetimeAggregates: {
    postsCount: 3,
    totalViews: 990000,
    totalLikes: 71000,
    totalComments: 2800,
    totalShares: 1160,
    totalSaves: 930,
    totalReposts: null,
    totalEngagement: 74960,
  },
  profilePeriodMetrics: {
    followers: {
      startValue: 118900,
      endValue: 120340,
      delta: 1440,
      growthRate: 1.21,
      previousStartValue: 117800,
      previousEndValue: 118900,
      previousDelta: 1100,
      deltaVsPrevious: 340,
      averageDailyDelta: 48,
    },
    following: {
      startValue: 118,
      endValue: 120,
      delta: 2,
      growthRate: 1.69,
      previousStartValue: 116,
      previousEndValue: 118,
      previousDelta: 2,
      deltaVsPrevious: 0,
      averageDailyDelta: 0.07,
    },
    totalLikes: {
      startValue: 930000,
      endValue: 980000,
      delta: 50000,
      growthRate: 5.38,
      previousStartValue: 880000,
      previousEndValue: 930000,
      previousDelta: 50000,
      deltaVsPrevious: 0,
      averageDailyDelta: 1666.7,
    },
    totalPosts: {
      startValue: 82,
      endValue: 84,
      delta: 2,
      growthRate: 2.44,
      previousStartValue: 80,
      previousEndValue: 82,
      previousDelta: 2,
      deltaVsPrevious: 0,
      averageDailyDelta: 0.07,
    },
  },
  series: [
    { date: "2026-05-04", label: "4 de mai.", viewsDelta: 120000 },
    { date: "2026-05-05", label: "5 de mai.", viewsDelta: 180000 },
    { date: "2026-05-06", label: "6 de mai.", viewsDelta: 260000 },
  ],
  diagnostics: [
    {
      id: "above-average-growth",
      category: "growth",
      message: 'O post "Primeiro post do ranking" cresceu acima da média da janela atual.',
    },
  ],
  posts: [
    {
      id: "post-1",
      url: "https://www.tiktok.com/@demoprofile/video/1",
      description: "Primeiro post do ranking",
      authorUsername: "demoprofile",
      publishedAt: "2026-05-02T10:00:00.000Z",
      hashtags: ["analytics", "tiktok"],
      likes: 18000,
      comments: 600,
      shares: 240,
      views: 210000,
      saves: 330,
      reposts: null,
      engagementTotal: 18840,
      periodViews: {
        startValue: 10000,
        endValue: 210000,
        delta: 200000,
        growthRate: 2000,
        previousStartValue: null,
        previousEndValue: null,
        previousDelta: null,
        deltaVsPrevious: null,
        averageDailyDelta: 6666.7,
      },
      periodLikes: {
        startValue: 1200,
        endValue: 18000,
        delta: 16800,
        growthRate: 1400,
        previousStartValue: null,
        previousEndValue: null,
        previousDelta: null,
        deltaVsPrevious: null,
        averageDailyDelta: 560,
      },
      periodComments: {
        startValue: 40,
        endValue: 600,
        delta: 560,
        growthRate: 1400,
        previousStartValue: null,
        previousEndValue: null,
        previousDelta: null,
        deltaVsPrevious: null,
        averageDailyDelta: 18.7,
      },
      periodShares: {
        startValue: 20,
        endValue: 240,
        delta: 220,
        growthRate: 1100,
        previousStartValue: null,
        previousEndValue: null,
        previousDelta: null,
        deltaVsPrevious: null,
        averageDailyDelta: 7.3,
      },
      periodSaves: {
        startValue: 25,
        endValue: 330,
        delta: 305,
        growthRate: 1220,
        previousStartValue: null,
        previousEndValue: null,
        previousDelta: null,
        deltaVsPrevious: null,
        averageDailyDelta: 43.5,
      },
      periodReposts: {
        startValue: null,
        endValue: null,
        delta: null,
        growthRate: null,
        previousStartValue: null,
        previousEndValue: null,
        previousDelta: null,
        deltaVsPrevious: null,
        averageDailyDelta: null,
      },
      rates: {
        engagementRate: 8.79,
        shareRate: 0.11,
        commentRate: 0.28,
        saveRate: 0.16,
        repostRate: null,
        engagementPer1000Views: 87.9,
      },
      score: 92,
      publishedInPeriod: true,
      grewInPeriod: true,
      evergreen: false,
      lateGrowth: false,
      tier: null,
      videoUrl: null,
      thumbnailUrl: null,
    },
  ],
  errorMessage: null,
};

async function mockTrpc(page: Page) {
  await page.route("**/api/trpc/**", async (route) => {
    const url = route.request().url();

    if (url.includes("getProfileDashboard") || url.includes("refreshProfile")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          result: {
            data: dashboardPayload,
          },
        }),
      });
      return;
    }

    await route.continue();
  });
}

test("searches by username from the landing page", async ({ page }) => {
  await mockTrpc(page);
  await page.goto("/");

  await expect(page.getByText("Acompanhe seu desempenho no TikTok")).toBeVisible();
  await page.getByPlaceholder("Cole o link do perfil ou digite o username").fill("@DemoProfile");
  await page.getByRole("button", { name: "Buscar perfil" }).click();

  await expect(page).toHaveURL(/\/perfil\/demoprofile\?range=30d&sort=best/);
  await expect(page.getByText("Demo Profile")).toBeVisible();
  await expect(page.getByText("Views ganhas", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Crescimento" })).toBeVisible();
});

test("accepts a profile url from the landing page", async ({ page }) => {
  await mockTrpc(page);
  await page.goto("/");

  await page.getByPlaceholder("Cole o link do perfil ou digite o username").fill("https://www.tiktok.com/@DemoProfile");
  await page.getByRole("button", { name: "Buscar perfil" }).click();

  await expect(page).toHaveURL(/\/perfil\/demoprofile\?range=30d&sort=best/);
  await expect(page.getByRole("table").getByText("Primeiro post do ranking")).toBeVisible();
});

test("shows an inline validation error without calling the backend when the input is not a profile", async ({ page }) => {
  await page.goto("/");

  await page.getByPlaceholder("Cole o link do perfil ou digite o username").fill("https://www.tiktok.com/@demo/video/123");
  await page.getByRole("button", { name: "Buscar perfil" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByText("Use o link do perfil, não o link de vídeo ou outro formato.")).toBeVisible();
});
