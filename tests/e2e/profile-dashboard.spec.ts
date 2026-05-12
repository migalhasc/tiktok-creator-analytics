import { expect, test } from "@playwright/test";

function buildDashboardPayload(overrides?: Partial<Record<string, unknown>>) {
  return {
    profile: {
      username: "demoprofile",
      displayName: "Demo Profile",
      biography: "Perfil de teste",
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
      postsCount: 2,
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
      postsCount: 2,
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
      {
        id: "replication-signal",
        category: "replication",
        message: 'Sinal de replicação: vale testar uma nova variação do formato de "Primeiro post do ranking".',
      },
    ],
    posts: [
      {
        id: "post-1",
        url: "https://www.tiktok.com/@demoprofile/video/1",
        description: "Primeiro post do ranking",
        authorUsername: "demoprofile",
        publishedAt: "2026-05-02T10:00:00.000Z",
        hashtags: ["analytics"],
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
    ...overrides,
  };
}

test("falls back to safe query defaults and keeps unsupported filters disabled", async ({ page }) => {
  await page.route("**/api/trpc/getProfileDashboard**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        result: {
          data: buildDashboardPayload(),
        },
      }),
    });
  });

  await page.goto("/perfil/demoprofile?range=invalid&sort=invalid");

  await expect(page).toHaveURL(/range=30d&sort=best/);
  await expect(page.getByRole("button", { name: "Mais salvos" })).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Mais repostados" })).toHaveCount(0);

  await page.getByRole("button", { name: "7 dias" }).click();
  await expect(page).toHaveURL(/range=7d&sort=best/);

  await page.getByRole("button", { name: "Mais vistos" }).click();
  await expect(page).toHaveURL(/range=7d&sort=viewed/);
});

test("shows the stale cache banner and triggers a background refresh", async ({ page }) => {
  let refreshCalls = 0;

  await page.route("**/api/trpc/getProfileDashboard**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        result: {
          data: buildDashboardPayload({
            cacheStatus: "stale",
            needsRefresh: true,
            errorMessage: "Última atualização antiga.",
          }),
        },
      }),
    });
  });

  await page.route("**/api/trpc/refreshProfile**", async (route) => {
    refreshCalls += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        result: {
          data: buildDashboardPayload(),
        },
      }),
    });
  });

  await page.goto("/perfil/demoprofile?range=30d&sort=best");

  await expect(page.getByText("Cache exibido. Atualizando em segundo plano.")).toBeVisible();
  await expect.poll(() => refreshCalls).toBe(1);
});

test("switches to refreshing immediately and polls until fresh after manual update", async ({ page }) => {
  let getDashboardCalls = 0;
  let refreshCalls = 0;

  await page.route("**/api/trpc/getProfileDashboard**", async (route) => {
    getDashboardCalls += 1;

    const payload =
      getDashboardCalls === 1
        ? buildDashboardPayload()
        : getDashboardCalls === 2
          ? buildDashboardPayload({
              cacheStatus: "refreshing",
              needsRefresh: true,
            })
          : buildDashboardPayload({
              cacheStatus: "fresh",
              needsRefresh: false,
              lastUpdatedAt: "2026-05-06T10:05:00.000Z",
              profile: {
                ...buildDashboardPayload().profile,
                followers: 120500,
              },
            });

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        result: {
          data: payload,
        },
      }),
    });
  });

  await page.route("**/api/trpc/refreshProfile**", async (route) => {
    refreshCalls += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        result: {
          data: buildDashboardPayload({
            cacheStatus: "refreshing",
            needsRefresh: true,
          }),
        },
      }),
    });
  });

  await page.goto("/perfil/demoprofile?range=30d&sort=best");

  await page.getByRole("button", { name: "Atualizar agora" }).click();

  await expect.poll(() => refreshCalls).toBe(1);
  await expect(page.getByText("Atualizando dados.")).toBeVisible();
  await expect.poll(() => getDashboardCalls).toBeGreaterThanOrEqual(3);
  await expect(page.getByText("Atualizando dados.")).toHaveCount(0);
  await expect(page.getByText("Seguidores: 120,5 mil")).toBeVisible();
});

test("distinguishes new posts from evergreen growers in the selected window", async ({ page }) => {
  await page.route("**/api/trpc/getProfileDashboard**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        result: {
          data: buildDashboardPayload({
            aggregates: {
              ...buildDashboardPayload().aggregates,
              postsPublishedInPeriod: 1,
              postsGrowingInPeriod: 2,
              evergreenPosts: 1,
            },
            posts: [
              {
                ...buildDashboardPayload().posts[0],
                id: "post-evergreen",
                description: "Post evergreen antigo",
                publishedAt: "2026-02-10T10:00:00.000Z",
                publishedInPeriod: false,
                grewInPeriod: true,
                evergreen: true,
                lateGrowth: false,
              },
              {
                ...buildDashboardPayload().posts[0],
                id: "post-new",
                description: "Post novo da janela",
                publishedAt: "2026-05-03T10:00:00.000Z",
                publishedInPeriod: true,
                grewInPeriod: true,
                evergreen: false,
                lateGrowth: false,
              },
            ],
          }),
        },
      }),
    });
  });

  await page.goto("/perfil/demoprofile?range=30d&sort=best");

  const evergreenRow = page.locator("tr", { hasText: "Post evergreen antigo" });
  const newRow = page.locator("tr", { hasText: "Post novo da janela" });

  await expect(evergreenRow.getByText("Cresceu na janela", { exact: true })).toBeVisible();
  await expect(evergreenRow.locator("span").filter({ hasText: "Evergreen" })).toBeVisible();
  await expect(evergreenRow.getByText("Novo na janela", { exact: true })).toHaveCount(0);

  await expect(newRow.getByText("Novo na janela", { exact: true })).toBeVisible();
  await expect(newRow.getByText("Cresceu na janela", { exact: true })).toBeVisible();

  await expect(page.getByText("Posts em crescimento").first()).toBeVisible();
  await expect(page.getByText("Evergreens ativos").first()).toBeVisible();
});

test("shows a refreshing banner while the first collection is still in progress", async ({ page }) => {
  await page.route("**/api/trpc/getProfileDashboard**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        result: {
          data: buildDashboardPayload({
            cacheStatus: "refreshing",
            needsRefresh: true,
            posts: [],
            aggregates: {
              postsCount: 0,
              totalViews: null,
              totalLikes: null,
              totalComments: null,
              totalShares: null,
              totalSaves: null,
              totalReposts: null,
              totalEngagement: null,
              engagementRateByViews: null,
              engagementRateByFollowers: null,
              shareRate: null,
              commentRate: null,
              saveRate: null,
              repostRate: null,
              engagementPer1000Views: null,
              postsPublishedInPeriod: 0,
              postsGrowingInPeriod: 0,
              evergreenPosts: 0,
            },
          }),
        },
      }),
    });
  });

  await page.goto("/perfil/demoprofile?range=30d&sort=best");

  await expect(
    page.getByText("Primeira coleta em andamento."),
  ).toBeVisible();
});

test("shows current public baseline instead of a wall of N/D when history is still forming", async ({ page }) => {
  await page.route("**/api/trpc/getProfileDashboard**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        result: {
          data: buildDashboardPayload({
            aggregates: {
              postsCount: 0,
              totalViews: null,
              totalLikes: null,
              totalComments: null,
              totalShares: null,
              totalSaves: null,
              totalReposts: null,
              totalEngagement: null,
              engagementRateByViews: null,
              engagementRateByFollowers: null,
              shareRate: null,
              commentRate: null,
              saveRate: null,
              repostRate: null,
              engagementPer1000Views: null,
              postsPublishedInPeriod: 0,
              postsGrowingInPeriod: 0,
              evergreenPosts: 0,
            },
            profilePeriodMetrics: {
              followers: {
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
              following: {
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
              totalLikes: {
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
              totalPosts: {
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
            },
            series: [
              { date: "2026-05-04", label: "4 de mai.", viewsDelta: null },
              { date: "2026-05-05", label: "5 de mai.", viewsDelta: null },
              { date: "2026-05-06", label: "6 de mai.", viewsDelta: null },
            ],
            diagnostics: [],
            posts: [
              {
                ...buildDashboardPayload().posts[0],
                periodViews: {
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
                periodLikes: {
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
                periodComments: {
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
                periodShares: {
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
              },
            ],
          }),
        },
      }),
    });
  });

  await page.goto("/perfil/demoprofile?range=30d&sort=best");

  await expect(page.getByText("Histórico diário em formação.")).toBeVisible();
  await expect(page.getByText("Views públicas atuais")).toBeVisible();
  await expect(page.getByText("Share rate atual")).toBeVisible();
  await expect(page.getByText("Comment rate atual")).toBeVisible();
  await expect(page.getByText("Save rate atual")).toBeVisible();
  await expect(page.getByText("Histórico da janela")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Em formação" })).toBeVisible();

  const shareTooltip = page.getByText("Compart./views");
  await expect(shareTooltip).not.toBeVisible();
  await page.getByRole("button", { name: "Ver detalhes de Share rate atual" }).click();
  await expect(shareTooltip).toBeVisible();
});

test("shows thumbnail and required public metrics for each ranked post", async ({ page }) => {
  await page.route("**/api/trpc/getProfileDashboard**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        result: {
          data: buildDashboardPayload({
            posts: [
              {
                ...buildDashboardPayload().posts[0],
                saves: 330,
                thumbnailUrl: "https://images.example.com/post-thumb.jpg",
              },
            ],
          }),
        },
      }),
    });
  });

  await page.goto("/perfil/demoprofile?range=30d&sort=best");

  const postRow = page.getByRole("row").filter({ hasText: "Primeiro post do ranking" });

  await expect(postRow.getByRole("img", { name: /Primeiro post do ranking/i })).toBeVisible();
  await expect(postRow.getByText("Curtidas", { exact: true })).toBeVisible();
  await expect(postRow.getByText("Comentários", { exact: true })).toBeVisible();
  await expect(postRow.getByText("Salvos", { exact: true })).toBeVisible();
  await expect(postRow.getByText("Compart.", { exact: true })).toBeVisible();
});

test("renders the route username immediately while the first dashboard query is still pending", async ({ page }) => {
  await page.route("**/api/trpc/getProfileDashboard**", async () => {
    await new Promise(() => undefined);
  });

  await page.goto("/perfil/demoprofile?range=30d&sort=best");

  await expect(page.getByRole("heading", { name: "@demoprofile" })).toBeVisible();
  await expect(page.getByText("Carregando dados.")).toBeVisible();
  await expect(page.getByText("Coletando posts e métricas.")).toBeVisible();
});
