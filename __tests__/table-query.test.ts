import { describe, it, expect } from "vitest";
import {
  parseTableSearchParams,
  tableStateToSearchParams,
  resolveVisibleColumns,
  DEFAULT_FILTERS,
  DEFAULT_SORT,
  type TableViewState,
} from "@/lib/table-query";

describe("parseTableSearchParams", () => {
  it("returns defaults for an empty query string", () => {
    const state = parseTableSearchParams(new URLSearchParams());
    expect(state.filters).toEqual(DEFAULT_FILTERS);
    expect(state.sort).toEqual(DEFAULT_SORT);
    expect(state.page).toBe(0);
    expect(state.columns).toBeNull();
  });

  it("parses known statuses and drops unknown ones", () => {
    const state = parseTableSearchParams(
      new URLSearchParams("status=confirmed,not_a_status,pending_review")
    );
    expect(state.filters.statuses).toEqual(["confirmed", "pending_review"]);
  });

  it("falls back to the default sort column for an unsortable/unknown value", () => {
    const state = parseTableSearchParams(new URLSearchParams("sort=message"));
    expect(state.sort.column).toBe(DEFAULT_SORT.column);
  });

  it("parses a valid secondary sort", () => {
    const state = parseTableSearchParams(
      new URLSearchParams("sort=amount&dir=desc&sort2=guest&dir2=asc")
    );
    expect(state.sort).toEqual({
      column: "amount",
      direction: "desc",
      column2: "guest",
      direction2: "asc",
    });
  });

  it("rejects a malformed date range", () => {
    const state = parseTableSearchParams(
      new URLSearchParams("from=not-a-date&to=2026-08-01")
    );
    expect(state.filters.dateFrom).toBeNull();
    expect(state.filters.dateTo).toBe("2026-08-01");
  });

  it("treats an explicit empty cols param as 'show nothing optional', not unset", () => {
    const state = parseTableSearchParams(new URLSearchParams("cols="));
    expect(state.columns).toEqual([]);
  });

  it("filters unknown column ids out of cols", () => {
    const state = parseTableSearchParams(
      new URLSearchParams("cols=guest,not_a_column,email")
    );
    expect(state.columns).toEqual(["guest", "email"]);
  });

  it("clamps a negative or non-integer page to 0", () => {
    expect(parseTableSearchParams(new URLSearchParams("page=-3")).page).toBe(0);
    expect(parseTableSearchParams(new URLSearchParams("page=abc")).page).toBe(0);
    expect(parseTableSearchParams(new URLSearchParams("page=2")).page).toBe(2);
  });
});

describe("tableStateToSearchParams", () => {
  it("produces an empty query string for the all-defaults state", () => {
    const state: TableViewState = {
      filters: DEFAULT_FILTERS,
      sort: DEFAULT_SORT,
      page: 0,
      columns: null,
    };
    expect(tableStateToSearchParams(state).toString()).toBe("");
  });

  it("round-trips through parse -> serialize -> parse", () => {
    const original = new URLSearchParams(
      "status=confirmed,declined&activity=Scuba&q=sid&from=2026-07-01&to=2026-08-01&conflicts=1&sort=amount&dir=desc&page=2&cols=guest,email"
    );
    const state = parseTableSearchParams(original);
    const roundTripped = parseTableSearchParams(tableStateToSearchParams(state));
    expect(roundTripped).toEqual(state);
  });

  it("omits page and cols when at their default", () => {
    const state = parseTableSearchParams(new URLSearchParams(""));
    const params = tableStateToSearchParams(state);
    expect(params.has("page")).toBe(false);
    expect(params.has("cols")).toBe(false);
  });
});

describe("resolveVisibleColumns", () => {
  it("prefers the URL's columns when present, even if empty", () => {
    expect(resolveVisibleColumns([], ["email"])).toEqual([]);
    expect(resolveVisibleColumns(["phone"], ["email"])).toEqual(["phone"]);
  });

  it("falls back to stored (localStorage) columns when the URL has none", () => {
    expect(resolveVisibleColumns(null, ["email"])).toEqual(["email"]);
  });

  it("falls back to the built-in defaults when neither URL nor storage has a value", () => {
    expect(resolveVisibleColumns(null, null).length).toBeGreaterThan(0);
  });
});
