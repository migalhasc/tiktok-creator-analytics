import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, screen } from "@testing-library/react";
import { AppShell } from "@/components/layout/app-shell";
import {
  EMBED_MODE_CLASS,
  buildDashboardSearchParams,
  buildProfilePath,
  isEmbedModeSearch,
  syncEmbedModeDom,
  withEmbedQuery,
} from "@/lib/embed";
import { renderWithRouter } from "./embed-test-helpers";

afterEach(() => {
  cleanup();
  syncEmbedModeDom(false);
});

describe("embed mode helpers", () => {
  it("detects embed mode from the search string", () => {
    expect(isEmbedModeSearch("?embed=1")).toBe(true);
    expect(isEmbedModeSearch("?range=30d&embed=1")).toBe(true);
    expect(isEmbedModeSearch("?range=30d")).toBe(false);
  });

  it("preserves the embed flag in internal profile navigation", () => {
    expect(buildProfilePath("demo", "30d", "best", true)).toBe("/perfil/demo?range=30d&sort=best&embed=1");
    expect(withEmbedQuery("/perfil/demo?range=7d&sort=viewed", false)).toBe("/perfil/demo?range=7d&sort=viewed");
  });

  it("builds search params that keep embed mode alive", () => {
    expect(buildDashboardSearchParams("7d", "viewed", true).toString()).toBe("range=7d&sort=viewed&embed=1");
    expect(buildDashboardSearchParams("30d", "best", false).toString()).toBe("range=30d&sort=best");
  });

  it("toggles embed classes on html and body", () => {
    syncEmbedModeDom(true);

    expect(document.documentElement).toHaveClass(EMBED_MODE_CLASS);
    expect(document.body).toHaveClass(EMBED_MODE_CLASS);

    syncEmbedModeDom(false);

    expect(document.documentElement).not.toHaveClass(EMBED_MODE_CLASS);
    expect(document.body).not.toHaveClass(EMBED_MODE_CLASS);
  });
});

describe("AppShell", () => {
  it("keeps the standalone header outside embed mode", () => {
    renderWithRouter(
      <AppShell>
        <div>dashboard</div>
      </AppShell>,
    );

    expect(screen.getByText("TikTok Analytics")).toBeInTheDocument();
    expect(screen.getByLabelText("Voltar para a busca")).toBeInTheDocument();
  });

  it("removes the standalone header in embed mode", () => {
    renderWithRouter(
      <AppShell embedMode>
        <div>dashboard</div>
      </AppShell>,
    );

    expect(screen.queryByText("TikTok Analytics")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Voltar para a busca")).not.toBeInTheDocument();
    expect(screen.getByText("dashboard")).toBeInTheDocument();
  });
});
