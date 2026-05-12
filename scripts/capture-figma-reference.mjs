import fs from "node:fs/promises";
import path from "node:path";
import { chromium, devices } from "@playwright/test";

const outputDir = path.resolve(process.cwd(), "figma-reference");
const targetUrl = "http://127.0.0.1:5173/perfil/micaelcrasto?range=30d&sort=best";

const dashboardPayload = {
  profile: {
    username: "micaelcrasto",
    displayName: "Micael Crasto",
    biography: "Analytics creator e estrategista de crescimento.",
    profileUrl: "https://www.tiktok.com/@micaelcrasto",
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
    saved: { enabled: false, reason: "Esse indicador ainda nao veio do Bright Data para este perfil." },
    reposted: { enabled: false, reason: "Esse indicador ainda nao veio do Bright Data para este perfil." },
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
    totalSaves: null,
    totalReposts: null,
    totalEngagement: 44680,
    engagementRateByViews: 7.98,
    engagementRateByFollowers: 37.12,
    shareRate: 0.14,
    commentRate: 0.34,
    saveRate: null,
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
    totalSaves: null,
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
      message: 'O post "Primeiro post do ranking" cresceu acima da media da janela atual.',
    },
    {
      id: "replication-signal",
      category: "replication",
      message: 'Sinal de replicacao: vale testar uma nova variacao do formato de "Primeiro post do ranking".',
    },
  ],
  posts: [
    {
      id: "post-1",
      url: "https://www.tiktok.com/@micaelcrasto/video/1",
      description: "Primeiro post do ranking",
      authorUsername: "micaelcrasto",
      publishedAt: "2026-05-02T10:00:00.000Z",
      hashtags: ["analytics"],
      likes: 18000,
      comments: 600,
      shares: 240,
      views: 210000,
      saves: null,
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
        saveRate: null,
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

async function mockDashboard(page) {
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

async function captureDesktop(browser) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 2200 },
    deviceScaleFactor: 2,
  });

  await mockDashboard(page);
  await page.goto(targetUrl, { waitUntil: "networkidle" });

  await page.screenshot({
    path: path.join(outputDir, "dashboard-desktop-full.png"),
    fullPage: true,
  });

  const sections = [
    ["dashboard-hero.png", "main > div > div:first-child"],
    ["dashboard-metrics.png", "main > div > div:nth-of-type(2)"],
    ["dashboard-growth.png", "main > div > div:nth-of-type(3)"],
    ["dashboard-diagnostics.png", "main > div > div:nth-of-type(4)"],
    ["dashboard-filters.png", "main > div > div:nth-of-type(5)"],
    ["dashboard-posts.png", "main > div > div:nth-of-type(6)"],
    ["dashboard-coverage.png", "main > div > div:nth-of-type(7)"],
  ];

  for (const [fileName, selector] of sections) {
    const locator = page.locator(selector).first();
    if ((await locator.count()) > 0) {
      await locator.screenshot({
        path: path.join(outputDir, fileName),
      });
    }
  }

  await page.close();
}

async function captureMobile(browser) {
  const page = await browser.newPage(devices["iPhone 13"]);
  await mockDashboard(page);
  await page.goto(targetUrl, { waitUntil: "networkidle" });

  await page.screenshot({
    path: path.join(outputDir, "dashboard-mobile-full.png"),
    fullPage: true,
  });

  await page.close();
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  const browser = await chromium.launch();

  try {
    await captureDesktop(browser);
    await captureMobile(browser);
  } finally {
    await browser.close();
  }

  const files = await fs.readdir(outputDir);
  console.log(JSON.stringify({ outputDir, files }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
