// ============================================================
// Recruiter API — All recruiter dashboard endpoints
// ============================================================

import { api } from './client'
import {
  RecruiterJob,
  RecruiterApplication,
  RecruiterStage,
  AppTag,
  Candidate,
  RecruiterConversation,
  RecruiterTeamMember,
  RecruiterPendingInvite,
  RecruiterPlan,
  RecruiterDashboardStats,
  PipelineDataPoint,
  ScheduleEvent,
  TrendDataPoint,
  SourceDataPoint,
  SkillDemandPoint,
  FunnelDataPoint,
  JobPerformance,
  CompanyProfile,
  DateRange,
} from '@/types/recruiter'

// ── Dashboard ──────────────────────────────────────────────

export interface ActiveJobRow {
  id: string;
  title: string;
  department: string;
  applicants: number;
  hot: boolean;
  status: string;
}

export interface RecentApplication {
  id: string;
  candidateName: string;
  candidateInitials: string;
  avatarColor: string;
  role: string;
  stage: string;
  appliedDate: string;
  matchScore: number;
  jobId: string;
}

export interface RecruiterDashboardData {
  stats: RecruiterDashboardStats
  pipeline: PipelineDataPoint[]
  pipelineStats: Record<string, number>
  schedule: ScheduleEvent[]
  recentApplications: RecentApplication[]
  activeJobRows: ActiveJobRow[]
  upcomingInterviews: unknown[]
}

export function getRecruiterDashboard() {
  return api.get<RecruiterDashboardData>('/recruiter/dashboard')
}

export function getRecruiterStats() {
  return api.get<RecruiterDashboardStats>('/recruiter/dashboard/stats')
}

export function getSchedule() {
  return api.get<ScheduleEvent[]>('/recruiter/dashboard/schedule')
}

// ── Jobs ───────────────────────────────────────────────────

export interface RecruiterJobsResponse {
  jobs: RecruiterJob[]
  total: number
}

export function getRecruiterJobs(status?: string) {
  const query = status ? `?status=${status}` : ''
  return api.get<RecruiterJobsResponse>(`/recruiter/jobs${query}`)
}

export function getRecruiterJob(jobId: string) {
  return api.get<RecruiterJob>(`/recruiter/jobs/${jobId}`)
}

export function createJob(data: Omit<RecruiterJob, 'id' | 'stats' | 'topCandidate' | 'postedDaysAgo'>) {
  return api.post<RecruiterJob>('/recruiter/jobs', data)
}

export function updateJob(jobId: string, data: Partial<RecruiterJob>) {
  return api.put<RecruiterJob>(`/recruiter/jobs/${jobId}`, data)
}

export function deleteJob(jobId: string) {
  return api.delete<{ success: boolean }>(`/recruiter/jobs/${jobId}`)
}

// ── Applications ───────────────────────────────────────────

export interface RecruiterApplicationsResponse {
  applications: RecruiterApplication[]
  total: number
}

export interface ApplicationFilters {
  jobId?: string
  stage?: RecruiterStage
  tags?: AppTag[]
  search?: string
  sort?: string
}

export function getRecruiterApplications(filters?: ApplicationFilters) {
  const params = new URLSearchParams()
  if (filters?.jobId) params.set('jobId', filters.jobId)
  if (filters?.stage) params.set('stage', filters.stage)
  if (filters?.tags?.length) params.set('tags', filters.tags.join(','))
  if (filters?.search) params.set('search', filters.search)
  if (filters?.sort) params.set('sort', filters.sort)
  const query = params.toString() ? `?${params}` : ''
  return api.get<RecruiterApplicationsResponse>(`/recruiter/applications${query}`)
}

export function updateApplicationStage(applicationId: string, stage: RecruiterStage) {
  return api.patch<{ success: boolean }>(`/recruiter/applications/${applicationId}/stage`, { stage })
}

export function addApplicationTag(applicationId: string, tag: AppTag) {
  return api.post<{ success: boolean }>(`/recruiter/applications/${applicationId}/tags`, { tag })
}

export function removeApplicationTag(applicationId: string, tag: AppTag) {
  return api.delete<{ success: boolean }>(`/recruiter/applications/${applicationId}/tags/${encodeURIComponent(tag)}`)
}

export function addApplicationNote(applicationId: string, note: string) {
  return api.post<{ success: boolean }>(`/recruiter/applications/${applicationId}/notes`, { note })
}

// ── Talent / Candidates ────────────────────────────────────

export interface TalentSearchParams {
  search?: string
  skills?: string[]
  niceToHave?: string[]
  universities?: string[]
  experience?: string
  availability?: string
  gradYears?: number[]
  githubActive?: boolean
  locations?: string[]
  salaryMin?: number
  salaryMax?: number
  sort?: string
  page?: number
  limit?: number
}

export interface TalentSearchResponse {
  candidates: Candidate[]
  total: number
  page: number
  totalPages: number
}

// Ensure the endpoint matches what's used in FastAPI: `/talent`
export async function searchTalent(params?: TalentSearchParams): Promise<TalentSearchResponse> {
  const query = new URLSearchParams()
  if (params?.search) query.append("search", params.search)
  if (params?.skills && params.skills.length > 0) {
    query.append("skills", params.skills.join(","))
  }
  if (params?.niceToHave && params.niceToHave.length > 0) {
    query.append("nice_to_have", params.niceToHave.join(","))
  }
  if (params?.universities && params.universities.length > 0) {
    query.append("universities", params.universities.join(","))
  }
  if (params?.gradYears && params.gradYears.length > 0) {
    query.append("grad_years", params.gradYears.join(","))
  }
  if (params?.locations && params.locations.length > 0) {
    query.append("locations", params.locations.join(","))
  }
  if (params?.salaryMin !== undefined) query.append("salary_min", params.salaryMin.toString())
  if (params?.salaryMax !== undefined) query.append("salary_max", params.salaryMax.toString())
  if (params?.githubActive !== undefined) query.append("github_active", params.githubActive.toString())
  if (params?.experience) query.append("experience", params.experience)
  if (params?.availability) query.append("availability", params.availability)
  if (params?.sort) query.append("sort", params.sort)
  if (params?.page) query.append("page", String(params.page))
  if (params?.limit) query.append("limit", String(params.limit))
  const queryString = query.toString() ? `?${query}` : ''
  return api.get<TalentSearchResponse>(`/recruiter/talent${queryString}`)
}

export function getCandidateDetail(candidateId: string) {
  return api.get<Candidate>(`/recruiter/talent/${candidateId}`)
}

export function saveCandidateToPool(candidateId: string) {
  return api.post<{ success: boolean }>(`/recruiter/talent/${candidateId}/save`)
}

export function removeCandidateFromPool(candidateId: string) {
  return api.delete<{ success: boolean }>(`/recruiter/talent/${candidateId}/save`)
}

// ── Messages ───────────────────────────────────────────────

export function getRecruiterConversations(filter?: 'all' | 'unread' | 'archived') {
  const query = filter && filter !== 'all' ? `?filter=${filter}` : ''
  return api.get<RecruiterConversation[]>(`/recruiter/messages${query}`)
}

export function getRecruiterConversation(conversationId: string) {
  return api.get<RecruiterConversation>(`/recruiter/messages/${conversationId}`)
}

export function sendRecruiterMessage(conversationId: string, text: string) {
  return api.post<{ success: boolean }>(`/recruiter/messages/${conversationId}`, { text })
}

export function markRecruiterConversationRead(conversationId: string) {
  return api.patch<{ success: boolean }>(`/recruiter/messages/${conversationId}/read`)
}

export function archiveConversation(conversationId: string) {
  return api.patch<{ success: boolean }>(`/recruiter/messages/${conversationId}/archive`)
}

export function createConversation(data: { candidateEmail: string; text: string; jobTitle?: string }) {
  return api.post<{ success: boolean; conversationId: string }>('/recruiter/messages', data)
}

// ── Settings ───────────────────────────────────────────────

export interface RecruiterAccountSettings {
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  companyName: string
}

export function getRecruiterAccount() {
  return api.get<RecruiterAccountSettings>('/recruiter/settings/account')
}

export function updateRecruiterAccount(data: Partial<RecruiterAccountSettings>) {
  return api.put<RecruiterAccountSettings>('/recruiter/settings/account', data)
}

export function getTeamMembers() {
  return api.get<{ members: RecruiterTeamMember[]; invites: RecruiterPendingInvite[] }>('/recruiter/settings/team')
}

export function inviteTeamMember(email: string, role: string) {
  return api.post<{ success: boolean }>('/recruiter/settings/team/invite', { email, role })
}

export function removeTeamMember(memberId: string) {
  return api.delete<{ success: boolean }>(`/recruiter/settings/team/${memberId}`)
}

export function revokeInvite(inviteId: string) {
  return api.delete<{ success: boolean }>(`/recruiter/settings/team/invites/${inviteId}`)
}

export function getRecruiterNotificationSettings() {
  return api.get<Record<string, boolean>>('/recruiter/settings/notifications')
}

export function updateRecruiterNotificationSettings(settings: Record<string, boolean>) {
  return api.put<Record<string, boolean>>('/recruiter/settings/notifications', settings)
}

export function getPlans() {
  return api.get<RecruiterPlan[]>('/recruiter/settings/plans')
}

export function changeRecruiterPassword(data: { currentPassword: string; newPassword: string }) {
  return api.post<{ success: boolean }>('/recruiter/settings/change-password', data)
}

// ── Analytics ──────────────────────────────────────────────

export interface RecruiterAnalytics {
  stats: {
    totalApplications: number
    avgMatchScore: number
    avgTimeToHire: number
    interviewRate: number
    offerAcceptRate: number
  }
  trends: TrendDataPoint[]
  sources: SourceDataPoint[]
  skillDemand: SkillDemandPoint[]
  funnel: FunnelDataPoint[]
  jobPerformance: JobPerformance[]
}

export function getRecruiterAnalytics(range: DateRange = '30d') {
  return api.get<RecruiterAnalytics>(`/recruiter/analytics?range=${range}`)
}

export function getAnalyticsTrends(range: DateRange) {
  return api.get<TrendDataPoint[]>(`/recruiter/analytics/trends?date_range=${range}`)
}

export function getSourceBreakdown() {
  return api.get<SourceDataPoint[]>('/recruiter/analytics/sources')
}

export function getSkillDemand() {
  return api.get<SkillDemandPoint[]>('/recruiter/analytics/skill-demand')
}

export function getFunnel() {
  return api.get<FunnelDataPoint[]>('/recruiter/analytics/funnel')
}

export function getJobPerformance() {
  return api.get<JobPerformance[]>('/recruiter/analytics/job-performance')
}

// ── Company ────────────────────────────────────────────────

export function getCompanyProfile() {
  return api.get<CompanyProfile>('/recruiter/company')
}

export function updateCompanyProfile(data: Partial<CompanyProfile>) {
  return api.put<CompanyProfile>('/recruiter/company', data)
}

export function uploadCompanyLogo(file: File) {
  const formData = new FormData()
  formData.append('logo', file)
  return api.upload<{ logoUrl: string }>('/recruiter/company/logo', formData)
}

export function uploadCompanyBanner(file: File) {
  const formData = new FormData()
  formData.append('banner', file)
  return api.upload<{ bannerUrl: string }>('/recruiter/company/banner', formData)
}
