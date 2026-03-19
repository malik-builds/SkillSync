// ── Job types ──────────────────────────────────────────────
export type JobStatus = "Active" | "Draft" | "Closed";
export type WorkType = "OnSite" | "Remote" | "Hybrid";

export interface RecruiterJob {
  id: string;
  title: string;
  company: string;
  location: string;
  workType: WorkType;
  salaryMin: number;
  salaryMax: number;
  postedDaysAgo: number;
  deadline: string;
  status: JobStatus;
  stats: {
    total: number;
    new: number;
    shortlisted: number;
    interview: number;
    views: number;
    avgMatch: number;
  };
  topCandidate: { name: string; match: number } | null;
  skills: string[];
  department: string;
}

// ── Application types ──────────────────────────────────────
export type RecruiterStage =
  | "New"
  | "Screening"
  | "Shortlisted"
  | "Interview"
  | "Offer"
  | "Hired"
  | "Rejected";

export type AppTag =
  | "Top Tier"
  | "On Hold"
  | "Referral"
  | "Needs Review"
  | "Culture Fit";

export interface RecruiterApplication {
  id: string;
  candidateName: string;
  candidateInitials: string;
  avatarColor: string;
  university: string;
  degree: string;
  major: string;
  location: string;
  jobId: string;
  jobTitle: string;
  department: string;
  source: "Direct" | "Referral" | "LinkedIn";
  appliedOn: string;
  appliedDaysAgo: number;
  stage: RecruiterStage;
  matchScore: number;
  skills: string[];
  github: { repos: number; commits6mo: number } | null;
  availabilityStatus: string;
  tags: AppTag[];
  note?: string;
  recruiterRating: number;
  studentEmail: string;
}

// ── Talent / Candidate types ───────────────────────────────
export interface CandidateSkill {
  name: string;
  score: number;
  source: "CV" | "GitHub" | "Both";
}

export interface Candidate {
  id: string;
  name: string;
  degree: string;
  major: string;
  university: string;
  graduatingYear: number;
  graduatingMonth: string;
  location: string;
  availableFor: "Remote" | "OnSite" | "Any";
  experience: "Fresh" | "<2yr" | "2-5yr" | "5+yr";
  skills: CandidateSkill[];
  github: { repos: number; commits6mo: number; active: boolean } | null;
  overallScore: number;
  matchScore: number;
  availabilityStatus: "Immediate" | "1 month notice" | "2+ months notice";
  salaryMin: number;
  salaryMax: number;
  saved: boolean;
  email: string;
  githubUrl?: string;
}

// ── Messaging types ────────────────────────────────────────
export type RecruiterFilterTab = "all" | "unread" | "archived";

export interface RecruiterMessage {
  id: string;
  sender: "recruiter" | "candidate";
  text: string;
  timestamp: string;
  timestampMs: number;
  read: boolean;
}

export interface RecruiterConversation {
  id: string;
  candidateId: string;
  candidateName: string;
  initials: string;
  avatarColor: string;
  jobTitle: string;
  messages: RecruiterMessage[];
  archived: boolean;
  lastMessageAt: number;
}

// ── Settings types ─────────────────────────────────────────
export type RecruiterSettingsTab = "account" | "notifications" | "team" | "billing";

export interface RecruiterTeamMember {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Recruiter" | "HR Manager" | "Viewer";
  isYou?: boolean;
  avatar: string;
  avatarColor: string;
  joinedDate: string;
}

export interface RecruiterPendingInvite {
  id: string;
  email: string;
  role: string;
  sentDate: string;
}

export interface RecruiterPlan {
  id: string;
  name: string;
  price: number | null;
  jobs: number;
  users: number;
  ats: boolean;
  analytics: boolean;
}

// ── Analytics types ────────────────────────────────────────
export type DateRange = "7d" | "30d" | "90d";

export interface TrendDataPoint {
  label: string;
  apps: number;
  interviews: number;
  offers: number;
}

export interface SourceDataPoint {
  name: string;
  value: number;
}

export interface SkillDemandPoint {
  skill: string;
  jobs: number;
}

export interface FunnelDataPoint {
  name: string;
  value: number;
  fill: string;
}

export interface JobPerformance {
  title: string;
  apps: number;
  match: number;
  days: number;
  warn: boolean;
}

// ── Company types ──────────────────────────────────────────
export interface CompanyBenefit {
  icon: string;
  label: string;
  note: string;
}

export interface CompanyContact {
  primaryContact: string;
  role: string;
  email: string;
  phone: string;
  address: string;
}

export interface CompanyStat {
  label: string;
  value: string;
}

export interface CompanyProfile {
  name: string;
  tagline: string;
  website: string;
  careersEmail: string;
  location: string;
  size: string;
  industry: string;
  founded: string;
  specialties: string[];
  about: string;
  benefits: CompanyBenefit[];
  contact: CompanyContact;
  stats: CompanyStat[];
}

// ── Dashboard types ────────────────────────────────────────
export interface RecruiterDashboardStats {
  recruiterName: string;
  activeJobs: number;
  totalCandidates: number;
  newApplicants: number;
  totalApplicants: number;
  interviews: number;
  hires: number;
  avgTimeToHire: number;
  offerAcceptRate: number;
}

export interface PipelineDataPoint {
  date: string;
  Screening: number;
  Qualified: number;
  Interviews: number;
  Offer: number;
  Hired: number;
  Rejected: number;
}

export interface ScheduleEvent {
  id: string;
  title: string;
  time: string;
  type: string;
  candidate?: string;
}
