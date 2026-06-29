/**
 * Cursor pagination helpers for super-admin list endpoints.
 *
 * Strategy: stable cursor on the primary key (BigInt id). Each list
 * endpoint orders by createdAt DESC and uses `{ id: 'desc' }` as a
 * tiebreaker. When the caller provides ?cursor=<id>, Prisma's `cursor`
 * + `skip: 1` returns the next page. We always over-fetch by one row so
 * we know whether a next page exists; that extra row never goes to the
 * client.
 *
 * Why cursor instead of offset: offset (skip/take) becomes O(n) on the
 * server for deep pages on Postgres, and produces inconsistent results
 * when rows are inserted between page fetches. Cursor pagination is
 * stable and O(log n) thanks to the BTREE index on primary key.
 *
 * Usage in a route:
 *
 *   const { limit, cursorArg, take } = parsePagination(req);
 *   const rows = await prisma.x.findMany({
 *     ...cursorArg,
 *     take,
 *     orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
 *   });
 *   const { data, nextCursor } = sliceForPage(rows, limit, (r) => String(r.id));
 *
 *   return NextResponse.json({ success: true, data: data.map(...), nextCursor });
 */

export interface CursorArg {
  cursor?: { id: bigint };
  skip?: number;
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export function parsePagination(req: Request): {
  limit: number;
  cursorArg: CursorArg;
  take: number;
} {
  const url = new URL(req.url);
  const rawLimit = parseInt(url.searchParams.get("limit") ?? "", 10);
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(rawLimit, MAX_LIMIT)
      : DEFAULT_LIMIT;
  const rawCursor = url.searchParams.get("cursor");
  const cursorArg: CursorArg = {};
  if (rawCursor && /^\d+$/.test(rawCursor)) {
    try {
      cursorArg.cursor = { id: BigInt(rawCursor) };
      cursorArg.skip = 1; // skip the row the cursor points at
    } catch {
      /* invalid cursor — treat as no cursor */
    }
  }
  return { limit, cursorArg, take: limit + 1 };
}

export function sliceForPage<T>(
  rows: T[],
  limit: number,
  idOf: (row: T) => string
): { data: T[]; nextCursor: string | null } {
  if (rows.length > limit) {
    const trimmed = rows.slice(0, limit);
    const last = trimmed[trimmed.length - 1];
    return { data: trimmed, nextCursor: idOf(last) };
  }
  return { data: rows, nextCursor: null };
}
