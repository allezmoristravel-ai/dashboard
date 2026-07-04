export const REQUEST_STATUSES = [
  "pending_review",
  "declined",
  "approved",
  "awaiting_payment",
  "confirmed",
  "reminded",
  "completed",
  "cancelled",
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const FORM_TYPES = ["rental", "accommodation", "activity", "transfer"] as const;

export type FormType = (typeof FORM_TYPES)[number];

export const FORM_TYPE_LABELS: Record<FormType, string> = {
  rental: "Car Rental",
  accommodation: "Accommodation",
  activity: "Activity",
  transfer: "Airport Transfer",
};

export interface BookingRequest {
  id: string;
  reference: string;
  activityName: string;
  fullName: string;
  email: string;
  phone: string;
  adults: number;
  children: number;
  startDate: string;
  endDate: string | null;
  message: string;
  formType: FormType;
  partySize: number;
  status: RequestStatus;
  totalAmount: number | null;
  paid: boolean;
  createdAt: string;
}

export const STATUS_LABELS: Record<RequestStatus, string> = {
  pending_review: "Pending Review",
  declined: "Declined",
  approved: "Approved",
  awaiting_payment: "Awaiting Payment",
  confirmed: "Confirmed",
  reminded: "Reminded",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const STATUS_COLORS: Record<RequestStatus, string> = {
  pending_review: "bg-amber-100 text-amber-800 border-amber-200",
  declined: "bg-red-100 text-red-800 border-red-200",
  approved: "bg-blue-100 text-blue-800 border-blue-200",
  awaiting_payment: "bg-purple-100 text-purple-800 border-purple-200",
  confirmed: "bg-green-100 text-green-800 border-green-200",
  reminded: "bg-sky-100 text-sky-800 border-sky-200",
  completed: "bg-gray-100 text-gray-800 border-gray-200",
  cancelled: "bg-red-50 text-red-600 border-red-100",
};

export const ACTIVE_STATUS_ORDER: RequestStatus[] = [
  "pending_review",
  "approved",
  "awaiting_payment",
  "confirmed",
];

export const ARCHIVE_STATUSES: RequestStatus[] = [
  "reminded",
  "completed",
  "declined",
  "cancelled",
];

export const STATUS_GROUP_LABELS: Record<string, string> = {
  pending_review: "Needs Review",
  approved: "Approved",
  awaiting_payment: "Awaiting Payment",
  confirmed: "Confirmed",
};

// --- Supabase row type (snake_case columns from booking.requests) ---

export interface DbBookingRequest {
  id: string;
  reference: string | null;
  activity_ref: string | null;
  activity_name: string;
  full_name: string;
  email: string;
  phone: string;
  adults: number;
  children: number;
  start_date: string;
  end_date: string | null;
  party_size: number;
  notes: string | null;
  message: string;
  form_type: FormType;
  status: string;
  total_amount: number | null;
  paid: boolean;
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
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    adults: row.adults,
    children: row.children,
    startDate: row.start_date,
    endDate: row.end_date,
    message: row.message ?? "",
    formType: row.form_type,
    partySize: row.party_size,
    status: row.status as RequestStatus,
    totalAmount: row.total_amount,
    paid: row.paid ?? false,
    createdAt: row.created_at,
  };
}

// --- Supabase row type (snake_case columns from booking.payments) ---

export interface DbPayment {
  id: string;
  request_id: string;
  provider: string;
  provider_txn_id: string | null;
  amount: number;
  currency: string;
  pay_url: string | null;
  status: "pending" | "paid" | "failed" | "expired";
  result_code: string | null;
  paid_at: string | null;
  created_at: string;
  quickbooks_invoice_id: string | null;
  quickbooks_customer_id: string | null;
  quickbooks_payment_id: string | null;
}
