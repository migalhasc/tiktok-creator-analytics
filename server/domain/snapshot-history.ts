import { rangeToDays, type SearchRange } from "@shared/domain";
import type { PostDailySnapshotRow, ProfileDailySnapshotRow } from "./tiktok-types";

export type PeriodBoundaries = {
  currentStartDate: string;
  currentEndDate: string;
  previousStartDate: string;
  previousEndDate: string;
};

export type SnapshotBoundarySet<T> = {
  currentStart: T | null;
  currentEnd: T | null;
  previousStart: T | null;
  previousEnd: T | null;
};

export type PostSnapshotBoundarySet<T> = SnapshotBoundarySet<T> & {
  postId: string;
};

function startOfUtcDay(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

export function formatSnapshotDate(value: Date): string {
  return startOfUtcDay(value).toISOString().slice(0, 10);
}

export function buildPeriodBoundaries(range: SearchRange, now = new Date()): PeriodBoundaries {
  const totalDays = rangeToDays[range];
  const currentEnd = startOfUtcDay(now);
  const currentStart = new Date(currentEnd);
  currentStart.setUTCDate(currentEnd.getUTCDate() - (totalDays - 1));

  const previousEnd = new Date(currentStart);
  previousEnd.setUTCDate(currentStart.getUTCDate() - 1);

  const previousStart = new Date(previousEnd);
  previousStart.setUTCDate(previousEnd.getUTCDate() - (totalDays - 1));

  return {
    currentStartDate: formatSnapshotDate(currentStart),
    currentEndDate: formatSnapshotDate(currentEnd),
    previousStartDate: formatSnapshotDate(previousStart),
    previousEndDate: formatSnapshotDate(previousEnd),
  };
}

export function pickClosestSnapshotAtOrBefore<T extends { snapshot_date: string }>(
  snapshots: T[],
  boundaryDate: string,
): T | null {
  let closest: T | null = null;

  for (const snapshot of snapshots) {
    if (snapshot.snapshot_date > boundaryDate) {
      break;
    }

    closest = snapshot;
  }

  return closest;
}

export function buildSnapshotBoundarySet<T extends { snapshot_date: string }>(
  snapshots: T[],
  boundaries: PeriodBoundaries,
): SnapshotBoundarySet<T> {
  return {
    currentStart: pickClosestSnapshotAtOrBefore(snapshots, boundaries.currentStartDate),
    currentEnd: pickClosestSnapshotAtOrBefore(snapshots, boundaries.currentEndDate),
    previousStart: pickClosestSnapshotAtOrBefore(snapshots, boundaries.previousStartDate),
    previousEnd: pickClosestSnapshotAtOrBefore(snapshots, boundaries.previousEndDate),
  };
}

export function buildPostSnapshotBoundarySets(
  snapshots: PostDailySnapshotRow[],
  boundaries: PeriodBoundaries,
): PostSnapshotBoundarySet<PostDailySnapshotRow>[] {
  const grouped = new Map<string, PostDailySnapshotRow[]>();

  for (const snapshot of snapshots) {
    const existing = grouped.get(snapshot.post_id) ?? [];
    existing.push(snapshot);
    grouped.set(snapshot.post_id, existing);
  }

  return Array.from(grouped.entries()).map(([postId, rows]) => ({
    postId,
    ...buildSnapshotBoundarySet(rows, boundaries),
  }));
}

export function hasEnoughHistory(boundarySet: SnapshotBoundarySet<ProfileDailySnapshotRow | PostDailySnapshotRow>): boolean {
  return boundarySet.currentStart != null && boundarySet.currentEnd != null;
}
