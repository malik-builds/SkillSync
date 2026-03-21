// ── Dashboard types ─────────────────────────────────────────
export type AlertSeverity = "critical" | "warning" | "info";
export type InterventionStatus = "implemented" | "pending" | "under-review";

export interface DashboardAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  detail: string;
  action: string;
  actionHref: string;
  // Fallbacks for backend inconsistency
  type?: string;
  message?: string;
  date?: string;
}

export interface RadarDataPoint {
  category: string;
  curriculum: number;
  industry: number;
}

export interface SkillBarDataPoint {
  skill: string;
  coverage: number;
  demand: number;
}

export interface PlacementDonutSegment {
  name: string;
  value: number;
  color: string;
}

export interface ProgrammePlacement {
  programme: string;
  rate: number;
}

export interface TopEmployer {
  name: string;
  hires: number;
  percentage: number;
  avgSalary: string;
  topRole: string;
  initials: string;
  color: string;
}

export interface Intervention {
  id: string;
  title: string;
  status: InterventionStatus;
  date: string;
  impact: string;
  programme: string;
}

export interface UniversityDashboardStats {
  totalStudents: number;
  averageMatchScore: number;
  placedStudents: number;
  totalPartners: number;
  recentJobMatches: number;
  atRiskStudents: number;
  institutionName?: string;
  personalName?: string;
}

// ── Students types ──────────────────────────────────────────
export interface Programme {
  name: string;
  students: number;
  avgScore: number;
  profileCompletion: number;
  githubRate: number;
  cvRate: number;
  atRisk: number;
}

export interface MissingSkill {
  skill: string;
  studentsLacking: number;
  category: string;
  severity: "critical" | "moderate" | "low";
}

export interface ScoreDistributionBin {
  range: string;
  count: number;
  color: string;
}

export interface StudentStats {
  totalStudents: number;
  avgScore: number;
  avgProfile: number;
  avgGithub: number;
  avgCv: number;
  totalAtRisk: number;
}

// ── Placements types ────────────────────────────────────────
export interface ProgrammeData {
  name: string;
  eligible: number;
  seeking: number;
  secured: number;
  rate: number;
  trend: number;
}

export interface CompanyData {
  id: string;
  rank: number;
  name: string;
  interns: number;
  roles: { role: string; count: number }[];
}

export interface RoleData {
  name: string;
  students: number;
  percent: number;
  duration: number;
}

export interface PlacementFunnel {
  label: string;
  value: number;
}

export interface DurationBreakdown {
  label: string;
  count: number;
  percentage: number;
}

// ── Partners types ──────────────────────────────────────────
export type PartnerStatus = "Active" | "Partner" | "New" | "Inactive";

export interface PartnerCompany {
  id: string;
  name: string;
  industry: string;
  size: string;
  status: PartnerStatus;
  studentsHired: number;
  activeJobs: number;
  rating: number;
  email: string;
  topRoles: string[];
  since: number;
  logoColor: string;
}

export interface PartnerStats {
  totalPartners: number;
  activePartners: number;
  totalHired: number;
  totalJobs: number;
}

// ── Curriculum types ────────────────────────────────────────
export type GapSeverity = "critical" | "moderate" | "good";

export interface CurriculumSkillData {
  id: string;
  name: string;
  category: string;
  studentCompetency: number;
  marketDemand: number;
  gap?: number;
  trend?: "up" | "stable" | "down";
}

export interface CurriculumStats {
  totalAnalyzed: number;
  alignmentScore: number;
}

// ── Settings types ──────────────────────────────────────────
export type UniversitySettingsTab = "account" | "team" | "notifications" | "data";

export interface UniTeamMember {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Department Head" | "View Only";
  isYou?: boolean;
  avatar: string;
  avatarColor: string;
  department: string;
  joinedDate: string;
}

export interface UniPendingInvite {
  id: string;
  email: string;
  role: string;
  sentDate: string;
}

export interface UniversityAccountSettings {
  institutionName: string;
  website: string;
  address: string;
  personalName: string;
  personalEmail: string;
  personalRole: string;
  personalPhone: string;
  faculty?: string;
  accountType?: string;
}
