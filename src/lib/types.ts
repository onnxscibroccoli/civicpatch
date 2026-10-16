export type Role = "resident" | "crew" | "dpw";

export type HazardClass =
  | "POTHOLE_SMALL"
  | "POTHOLE_LARGE"
  | "LINE_STRIPING"
  | "ROAD_MARKER"
  | "ROAD_DEBRIS";

export type TicketStatus =
  | "REPORTED"
  | "APPROVED_FOR_BID"
  | "CLAIMED"
  | "WORK_SUBMITTED"
  | "VERIFIED_PAID"
  | "REJECTED";

export type PayoutStatus =
  | "HELD_IN_ESCROW"
  | "PENDING_DISBURSEMENT"
  | "DISBURSED";

export type CaptureMode = "gps" | "sandbox";

export interface LedgerEvent {
  at: string;
  label: string;
  detail?: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  hazardClass: HazardClass;
  status: TicketStatus;
  lat: number;
  lng: number;
  address: string;
  townSlug: string;
  reporterName: string;
  beforePhoto: string;
  afterPhoto?: string;
  createdAt: string;
  approvedAt?: string;
  rateAtApproval?: number;
  lockedRate?: number;
  claimedAt?: string;
  claimExpiresAt?: string;
  contractorName?: string;
  workSubmittedAt?: string;
  spatialDeltaM?: number;
  geofencePass?: boolean;
  captureMode?: CaptureMode;
  payoutStatus?: PayoutStatus;
  disbursedAt?: string;
  rejectReason?: string;
  noticeBody?: string;
  noticeSha256?: string;
  events: LedgerEvent[];
}

export interface QuizScore {
  correct: number;
  total: number;
  passed: boolean;
}

export interface Onboarding {
  step: number;
  fitAck: boolean;
  contactName: string;
  businessName: string;
  townSlug: string;
  structure: "" | "sole" | "llc";
  insurancePolicy: string;
  insuranceExpires: string;
  insuranceAck: boolean;
  oshaPlan: "" | "have" | "booked";
  oshaNumber: string;
  equipment: string[];
  rulesAck: boolean;
  ethicsAck: boolean;
  activatedAt?: string;
}
