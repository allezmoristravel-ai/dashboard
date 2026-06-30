export const REQUEST_STATUSES = [
  "pending_review",
  "declined",
  "approved",
  "awaiting_deposit",
  "deposit_paid",
  "awaiting_balance",
  "confirmed",
  "reminded",
  "completed",
  "cancelled",
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export interface BookingRequest {
  id: string;
  reference: string;
  activityName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  requestedDate: string;
  partySize: number;
  notes: string;
  status: RequestStatus;
  depositAmount: number | null;
  balanceAmount: number | null;
  totalAmount: number | null;
  depositPaid: boolean;
  balancePaid: boolean;
  createdAt: string;
}

export interface AmountUpdate {
  deposit: number;
  balance: number;
  total: number;
}

export const STATUS_LABELS: Record<RequestStatus, string> = {
  pending_review: "Pending Review",
  declined: "Declined",
  approved: "Approved",
  awaiting_deposit: "Awaiting Deposit",
  deposit_paid: "Deposit Paid",
  awaiting_balance: "Awaiting Balance",
  confirmed: "Confirmed",
  reminded: "Reminded",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const STATUS_COLORS: Record<RequestStatus, string> = {
  pending_review: "bg-amber-100 text-amber-800 border-amber-200",
  declined: "bg-red-100 text-red-800 border-red-200",
  approved: "bg-blue-100 text-blue-800 border-blue-200",
  awaiting_deposit: "bg-purple-100 text-purple-800 border-purple-200",
  deposit_paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
  awaiting_balance: "bg-orange-100 text-orange-800 border-orange-200",
  confirmed: "bg-green-100 text-green-800 border-green-200",
  reminded: "bg-sky-100 text-sky-800 border-sky-200",
  completed: "bg-gray-100 text-gray-800 border-gray-200",
  cancelled: "bg-red-50 text-red-600 border-red-100",
};

export const ACTIVE_STATUS_ORDER: RequestStatus[] = [
  "pending_review",
  "approved",
  "awaiting_deposit",
  "deposit_paid",
  "awaiting_balance",
  "confirmed",
];

export const ARCHIVE_STATUSES: RequestStatus[] = [
  "reminded",
  "completed",
  "declined",
  "cancelled",
];

export const DEFAULT_AMOUNTS = {
  deposit: 2500,
  balance: 5000,
  total: 7500,
};

export const STATUS_GROUP_LABELS: Record<string, string> = {
  pending_review: "Needs Review",
  approved: "Approved — Set Amount",
  awaiting_deposit: "Awaiting Deposit",
  deposit_paid: "Deposit Paid",
  awaiting_balance: "Awaiting Balance",
  confirmed: "Confirmed",
};

// --- Supabase row type (snake_case columns from booking.requests) ---

export interface DbBookingRequest {
  id: string;
  reference: string | null;
  activity_ref: string | null;
  activity_name: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  requested_date: string;
  party_size: number;
  notes: string | null;
  status: string;
  deposit_amount: number | null;
  balance_amount: number | null;
  total_amount: number | null;
  deposit_paid: boolean | null;
  balance_paid: boolean | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export function mapDbRow(row: DbBookingRequest): BookingRequest {
  return {
    id: row.id,
    reference: row.reference ?? "",
    activityName: row.activity_name ?? "",
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone ?? "",
    requestedDate: row.requested_date,
    partySize: row.party_size,
    notes: row.notes ?? "",
    status: row.status as RequestStatus,
    depositAmount: row.deposit_amount,
    balanceAmount: row.balance_amount,
    totalAmount: row.total_amount,
    depositPaid: row.deposit_paid ?? false,
    balancePaid: row.balance_paid ?? false,
    createdAt: row.created_at,
  };
}
