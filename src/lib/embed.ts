import { defaultRange, defaultSort, type SearchRange, type SortKey } from "@shared/domain";

export const EMBED_MODE_CLASS = "embed-mode";
export const EMBED_SEARCH_PARAM = "embed";
export const EMBED_SEARCH_VALUE = "1";

export function isEmbedModeSearch(search: string): boolean {
  const normalizedSearch = search.startsWith("?") ? search.slice(1) : search;
  return new URLSearchParams(normalizedSearch).get(EMBED_SEARCH_PARAM) === EMBED_SEARCH_VALUE;
}

export function syncEmbedModeDom(enabled: boolean, doc: Document = document) {
  doc.documentElement.classList.toggle(EMBED_MODE_CLASS, enabled);
  doc.body.classList.toggle(EMBED_MODE_CLASS, enabled);
}

export function withEmbedQuery(path: string, embedMode: boolean): string {
  if (!embedMode) {
    return path;
  }

  const url = new URL(path, "https://embed.local");
  url.searchParams.set(EMBED_SEARCH_PARAM, EMBED_SEARCH_VALUE);

  return `${url.pathname}${url.search}${url.hash}`;
}

export function buildDashboardSearchParams(
  range: SearchRange = defaultRange,
  sort: SortKey = defaultSort,
  embedMode = false,
) {
  const params = new URLSearchParams({
    range,
    sort,
  });

  if (embedMode) {
    params.set(EMBED_SEARCH_PARAM, EMBED_SEARCH_VALUE);
  }

  return params;
}

export function buildProfilePath(
  username: string,
  range: SearchRange = defaultRange,
  sort: SortKey = defaultSort,
  embedMode = false,
) {
  return withEmbedQuery(`/perfil/${username}?range=${range}&sort=${sort}`, embedMode);
}
