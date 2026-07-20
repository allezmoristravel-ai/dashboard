import { REQUEST_STATUSES, type RequestStatus } from "./types";

// Optional/toggleable table columns. "conflict" and "status" are always
// shown and are not part of this set — see DEFAULT_TABLE_COLUMNS below.
export const TABLE_COLUMN_IDS = [
  "guest",
  "activity",
  "date",
  "party",
  "amount",
  "email",
  "phone",
  "submitted",
  "reference",
  "message",
  "quickbooks",
] as const;

export type TableColumnId = (typeof TABLE_COLUMN_IDS)[number];

const KNOWN_COLUMNS = new Set<string>(TABLE_COLUMN_IDS);

export const DEFAULT_TABLE_COLUMNS: TableColumnId[] = [
  "guest",
  "activity",
  "date",
  "party",
  "amount",
];

export const COLUMN_LABELS: Record<TableColumnId, string> = {
  guest: "Guest",
  activity: "Activity",
  date: "Date",
  party: "Party",
  amount: "Amount",
  email: "Email",
  phone: "Phone",
  submitted: "Submitted",
  reference: "Reference",
  message: "Message",
  quickbooks: "QuickBooks refs",
};

// Columns available behind the column picker (i.e. not on by default).
export const HIDDEN_BY_DEFAULT_COLUMNS: TableColumnId[] = TABLE_COLUMN_IDS.filter(
  (id) => !DEFAULT_TABLE_COLUMNS.includes(id)
);

// Sortable columns and the DB field each maps to. "conflict" and "message"
// are deliberately not sortable (derived / free text).
export const SORTABLE_FIELDS = {
  status: "status",
  guest: "full_name",
  activity: "activity_name",
  date: "start_date",
  party: "party_size",
  amount: "total_amount",
  email: "email",
  phone: "phone",
  submitted: "created_at",
  reference: "reference",
} as const;

export type SortColumnId = keyof typeof SORTABLE_FIELDS;

const KNOWN_SORT_COLUMNS = new Set<string>(Object.keys(SORTABLE_FIELDS));

// Header labels for sortable columns — separate from COLUMN_LABELS because
// "status" is sortable but isn't a toggleable column (it's always shown).
export const SORT_COLUMN_LABELS: Record<SortColumnId, string> = {
  status: "Status",
  guest: COLUMN_LABELS.guest,
  activity: COLUMN_LABELS.activity,
  date: COLUMN_LABELS.date,
  party: COLUMN_LABELS.party,
  amount: COLUMN_LABELS.amount,
  email: COLUMN_LABELS.email,
  phone: COLUMN_LABELS.phone,
  submitted: COLUMN_LABELS.submitted,
  reference: COLUMN_LABELS.reference,
};

export type SortDirection = "asc" | "desc";

export interface TableSort {
  column: SortColumnId;
  direction: SortDirection;
  column2?: SortColumnId;
  direction2?: SortDirection;
}

export const DEFAULT_SORT: TableSort = { column: "date", direction: "asc" };

export interface TableFilters {
  statuses: RequestStatus[]; // empty array = all statuses
  activity: string | null;
  search: string;
  dateFrom: string | null; // YYYY-MM-DD, inclusive, over start_date
  dateTo: string | null; // YYYY-MM-DD, inclusive, over start_date
  conflictsOnly: boolean;
}

export const DEFAULT_FILTERS: TableFilters = {
  statuses: [],
  activity: null,
  search: "",
  dateFrom: null,
  dateTo: null,
  conflictsOnly: false,
};

export interface TableViewState {
  filters: TableFilters;
  sort: TableSort;
  page: number; // 0-based
  columns: TableColumnId[] | null; // null = "not specified in URL", fall back to localStorage/default
}

const PAGE_SIZE = 50;
export { PAGE_SIZE };

function parseStatuses(raw: string | null): RequestStatus[] {
  if (!raw) return [];
  const known = new Set<string>(REQUEST_STATUSES);
  return raw.split(",").filter((s): s is RequestStatus => known.has(s));
}

function parseColumns(raw: string | null): TableColumnId[] | null {
  if (raw === null) return null;
  if (raw === "") return [];
  return raw
    .split(",")
    .filter((c): c is TableColumnId => KNOWN_COLUMNS.has(c));
}

function parseSortColumn(raw: string | null): SortColumnId | null {
  if (raw && KNOWN_SORT_COLUMNS.has(raw)) return raw as SortColumnId;
  return null;
}

function parseDirection(raw: string | null): SortDirection {
  return raw === "desc" ? "desc" : "asc";
}

function isValidIsoDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

// Pure: URLSearchParams -> TableViewState. Unknown/invalid values fall back
// to defaults rather than throwing, so a hand-edited or stale URL degrades
// gracefully instead of breaking the page.
export function parseTableSearchParams(params: URLSearchParams): TableViewState {
  const dateFromRaw = params.get("from");
  const dateToRaw = params.get("to");

  const sortColumn = parseSortColumn(params.get("sort")) ?? DEFAULT_SORT.column;
  const sortColumn2 = parseSortColumn(params.get("sort2"));

  const pageRaw = Number(params.get("page"));
  const page = Number.isInteger(pageRaw) && pageRaw >= 0 ? pageRaw : 0;

  return {
    filters: {
      statuses: parseStatuses(params.get("status")),
      activity: params.get("activity") || null,
      search: params.get("q") ?? "",
      dateFrom: dateFromRaw && isValidIsoDate(dateFromRaw) ? dateFromRaw : null,
      dateTo: dateToRaw && isValidIsoDate(dateToRaw) ? dateToRaw : null,
      conflictsOnly: params.get("conflicts") === "1",
    },
    sort: {
      column: sortColumn,
      direction: parseDirection(params.get("dir")),
      ...(sortColumn2
        ? { column2: sortColumn2, direction2: parseDirection(params.get("dir2")) }
        : {}),
    },
    page,
    columns: parseColumns(params.get("cols")),
  };
}

// Pure: TableViewState -> URLSearchParams. Omits keys at their default value
// so a default view has a clean URL. Inverse of parseTableSearchParams.
export function tableStateToSearchParams(state: TableViewState): URLSearchParams {
  const params = new URLSearchParams();
  const { filters, sort, page, columns } = state;

  if (filters.statuses.length > 0) params.set("status", filters.statuses.join(","));
  if (filters.activity) params.set("activity", filters.activity);
  if (filters.search) params.set("q", filters.search);
  if (filters.dateFrom) params.set("from", filters.dateFrom);
  if (filters.dateTo) params.set("to", filters.dateTo);
  if (filters.conflictsOnly) params.set("conflicts", "1");

  if (sort.column !== DEFAULT_SORT.column) params.set("sort", sort.column);
  if (sort.direction !== DEFAULT_SORT.direction) params.set("dir", sort.direction);
  if (sort.column2) {
    params.set("sort2", sort.column2);
    if (sort.direction2 && sort.direction2 !== "asc") params.set("dir2", sort.direction2);
  }

  if (page > 0) params.set("page", String(page));
  if (columns !== null) params.set("cols", columns.join(","));

  return params;
}

export function resolveVisibleColumns(
  urlColumns: TableColumnId[] | null,
  storedColumns: TableColumnId[] | null
): TableColumnId[] {
  return urlColumns ?? storedColumns ?? DEFAULT_TABLE_COLUMNS;
}
