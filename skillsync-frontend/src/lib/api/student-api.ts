// ============================================================
// Student API — All student dashboard endpoints
// ============================================================

import { api } from './client'
import { JobPosting, JobMatchAndAnalysis } from '@/types/jobs'
import { Application } from '@/types/applications'
import { Conversation } from '@/types/messages'
import { StudentProfile, Skill } from '@/types/profile'
import { LearningPath } from '@/types/learning-path'
import { SkillData, SkillGap, JobMatch, Recommendation } from '@/types/analysis'
import { CVProfile, CVAnalysis } from '@/types/cv'

// ── Dashboard ──────────────────────────────────────────────

export interface SkillGrowthPoint {
  date: string
  score: number
  skills: number
}

export interface StudentDashboardData {
  kpis: {
    matchScore: number
    appliedCount: number
    interviewCount: number
    profileStrength: number
    criticalGapCount: number
  }
  skillGrowth: SkillGrowthPoint[]
  recentActivities: { title: string; subtitle: string; color: string; time: string }[]
  recentApplications: any[]
  suggestedJobs: {
    id: string
    title: string
    company: string
    location: string
    type: string
    matchScore: number
    tags: string[]
  }[]
}

export function getStudentDashboard() {
  return api.get<StudentDashboardData>('/student/dashboard')
}

// ── Jobs ───────────────────────────────────────────────────

export interface JobSearchParams {
  q?: string
  type?: string
  location?: string
  mode?: string
  sort?: string
  page?: number
  limit?: number
}

export interface JobSearchResponse {
  jobs: JobPosting[]
  total: number
  page: number
  totalPages: number
}

export function searchJobs(params?: JobSearchParams) {
  const query = params ? '?' + new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => [k, String(v)])
  ).toString() : ''
  return api.get<JobSearchResponse>(`/student/jobs${query}`)
}

export function getJobDetail(jobId: string) {
  return api.get<JobPosting>(`/student/jobs/${jobId}`)
}

export function getJobAnalysis(jobId: string) {
  return api.get<JobMatchAndAnalysis>(`/student/jobs/${jobId}/analysis`)
}

export function applyToJob(jobId: string, data?: { coverLetter?: string }) {
  return api.post<{ success: boolean }>(`/student/jobs/${jobId}/apply`, data)
}

export function saveJob(jobId: string) {
  return api.post<{ success: boolean }>(`/student/jobs/${jobId}/save`)
}

export function unsaveJob(jobId: string) {
  return api.delete<{ success: boolean }>(`/student/jobs/${jobId}/save`)
}

// ── Applications ───────────────────────────────────────────

export interface ApplicationsResponse {
  applications: Application[]
  stats: {
    total: number
    active: number
    interviews: number
    offers: number
    rejected: number
  }
}

type BackendStudentApplication = {
  id: string
  jobId?: string
  jobTitle?: string
  role?: string
  company?: string
  location?: string
  appliedDate?: string
  appliedAt?: string
  status?: string
  stage?: string
  tags?: string[]
  matchScore?: number
}

function mapStageToStatus(stage?: string): Application['status'] {
  const value = (stage || '').toLowerCase()
  if (value === 'applied') return 'Applied'
  if (value === 'reviewing' || value === 'screening') return 'Screening'
  if (value === 'shortlisted') return 'Shortlisted'
  if (value === 'interview') return 'Interview'
  if (value === 'offer') return 'Offer'
  if (value === 'hired') return 'Hired'
  if (value === 'rejected') return 'Rejected'
  return 'Applied'
}

function buildPipelineSteps(status: Application['status'], appliedDate?: string) {
  const steps = [
    { label: 'Applied', status: 'pending' as const },
    { label: 'Screening', status: 'pending' as const },
    { label: 'Shortlisted', status: 'pending' as const },
    { label: 'Interview', status: 'pending' as const },
    { label: 'Offer', status: 'pending' as const },
  ]

  const currentIndex = status === 'Applied'
    ? 0
    : status === 'Screening'
      ? 1
      : status === 'Shortlisted'
        ? 2
        : status === 'Interview'
          ? 3
          : status === 'Offer' || status === 'Hired'
            ? 4
            : -1

  if (currentIndex >= 0) {
    return steps.map((step, i) => ({
      ...step,
      date: i === 0 ? appliedDate : undefined,
      status: i < currentIndex ? ('completed' as const) : i === currentIndex ? ('current' as const) : ('pending' as const),
    }))
  }

  // Rejected path: keep pipeline completed up to screening for context.
  return steps.map((step, i) => ({
    ...step,
    date: i === 0 ? appliedDate : undefined,
    status: i <= 1 ? ('completed' as const) : ('pending' as const),
  }))
}

export function getApplications(status?: string) {
  const query = status ? `?status=${status}` : ''
  return api.get<BackendStudentApplication[] | { applications?: BackendStudentApplication[]; stats?: ApplicationsResponse['stats'] }>(`/student/applications${query}`)
    .then((raw) => {
      const rawApplications = Array.isArray(raw) ? raw : (raw.applications || [])
      const rawStats = Array.isArray(raw) ? undefined : raw.stats

      const applications = rawApplications.map((app) => {
        const normalizedStatus = mapStageToStatus(app.status || app.stage)
        const appliedDate = app.appliedDate || app.appliedAt || ''
        return {
          id: app.id,
          jobId: app.jobId || '',
          jobTitle: app.jobTitle || app.role || 'Unknown Role',
          company: app.company || 'Unknown Company',
          location: app.location || 'Sri Lanka',
          appliedDate,
          status: normalizedStatus,
          tags: app.tags || [],
          steps: buildPipelineSteps(normalizedStatus, appliedDate),
          matchScore: app.matchScore || 0,
        } as Application
      })

      return {
        applications,
        stats: {
          total: rawStats?.total || applications.length,
          active: rawStats?.active || applications.filter((a) => ["Applied", "Screening", "Interview"].includes(a.status)).length,
          interviews: rawStats?.interviews || applications.filter((a) => a.status === "Interview").length,
          offers: rawStats?.offers || applications.filter((a) => a.status === "Offer").length,
          rejected: rawStats?.rejected || applications.filter((a) => a.status === "Rejected").length,
        },
      } as ApplicationsResponse
    })
}

export function getApplicationDetail(applicationId: string) {
  return api.get<Application>(`/student/applications/${applicationId}`)
}

export function withdrawApplication(applicationId: string) {
  return api.delete<{ success: boolean }>(`/student/applications/${applicationId}`)
}

// ── Messages ───────────────────────────────────────────────

export function getConversations() {
  return api.get<Conversation[]>('/student/messages')
}

export function getConversation(conversationId: string) {
  return api.get<Conversation>(`/student/messages/${conversationId}`)
}

export function sendMessage(conversationId: string, text: string) {
  return api.post<{ success: boolean }>(`/student/messages/${conversationId}`, { text })
}

export function markConversationRead(conversationId: string) {
  return api.patch<{ success: boolean }>(`/student/messages/${conversationId}/read`)
}

// ── Profile ────────────────────────────────────────────────

export async function getStudentProfile(): Promise<StudentProfile> {
  const raw = await api.get<any>('/student/profile')
  // Transform backend string[] skills into Skill[] objects
  const skills: Skill[] = (raw.skills || []).map((s: string | Skill) => {
    if (typeof s === 'string') {
      return { name: s, level: 'Intermediate' as const, source: 'cv' as const, verified: false }
    }
    return s
  })
  return { ...raw, skills } as StudentProfile
}

export function updateStudentProfile(updates: Partial<StudentProfile>) {
  return api.patch<StudentProfile>('/student/profile', updates)
}

export function addManualSkill(name: string) {
  return api.post<StudentProfile>('/student/profile/skills', { name })
}

export function verifyGithubProfile() {
  return api.post<{ success: boolean; verifiedSkills: string[] }>('/student/profile/verify-github')
}

export function uploadAvatar(file: File) {
  const formData = new FormData()
  formData.append('avatar', file)
  return api.upload<{ avatarUrl: string }>('/student/profile/avatar', formData)
}

export function removeAvatar() {
  return api.delete<{ avatarUrl: string }>('/student/profile/avatar')
}

// ── Learning Path ──────────────────────────────────────────

export function getLearningPaths() {
  return api.get<LearningPath[]>('/student/learning-paths')
}

export function getLearningPath(pathId: string) {
  return api.get<LearningPath>(`/student/learning-paths/${pathId}`)
}

export function updateNodeProgress(pathId: string, nodeId: string, progress: number, completed?: boolean) {
  return api.patch<{ success: boolean }>(`/student/learning-paths/${pathId}/nodes/${nodeId}`, { progress, completed })
}

export function addSkillToLearningPath(skill: string) {
  return api.post<{ success: boolean; alreadyAdded: boolean }>('/student/learning-paths/add-skill', { skill })
}

// ── Analysis ───────────────────────────────────────────────

export interface AnalysisOverview {
  targetRole?: string
  score: number
  radarData: SkillData[]
  gaps: SkillGap[]
  matchedJobs: JobMatch[]
  recommendations: Recommendation[]
}

export function getAnalysisOverview() {
  return api.get<AnalysisOverview>('/student/analysis')
}

export function getSkillGaps() {
  return api.get<SkillGap[]>('/student/analysis/gaps')
}

export function getJobMatches() {
  return api.get<JobMatch[]>('/student/analysis/job-matches')
}

export function getRecommendations() {
  return api.get<Recommendation[]>('/student/analysis/recommendations')
}

// ── CV ─────────────────────────────────────────────────────

export function getCVProfile() {
  return api.get<CVProfile>('/student/cv')
}

export function updateCVProfile(updates: Partial<CVProfile>) {
  return api.put<CVProfile>('/student/cv', updates)
}

export function getCVAnalysis() {
  return api.get<CVAnalysis>('/student/cv/analysis')
}

export function downloadCV(template: string) {
  return api.get<Blob>(`/student/cv/download?template=${template}`)
}

// ── Settings ───────────────────────────────────────────────

export interface StudentSettings {
  email: string
  notifications: {
    jobAlerts: boolean
    applicationUpdates: boolean
    messages: boolean
    weeklyDigest: boolean
  }
  privacy: {
    profileVisible: boolean
    showGitHub: boolean
    showEmail: boolean
  }
}

export function getStudentSettings() {
  return api.get<StudentSettings>('/student/settings')
}

export function updateStudentSettings(updates: Partial<StudentSettings>) {
  return api.put<StudentSettings>('/student/settings', updates)
}

export function changePassword(data: { currentPassword: string; newPassword: string }) {
  return api.post<{ success: boolean }>('/student/settings/change-password', data)
}

export function deleteAccount() {
  return api.delete<{ success: boolean }>('/student/settings/account')
}

// ── Messaging ──────────────────────────────────────────────

export interface StudentConversation {
  id: string
  recruiterId: string
  recruiterName: string
  initials: string
  jobTitle: string
  messages: {
    id: string
    sender: 'me' | 'them'
    senderName: string
    text: string
    timestamp: string
    timestampMs: number
    read: boolean
  }[]
  archived: boolean
  lastMessageAt: number
  unreadCount: number
}

export function getStudentConversations() {
  return api.get<StudentConversation[]>('/student/messages')
}

export function getStudentConversation(convId: string) {
  return api.get<StudentConversation>(`/student/messages/${convId}`)
}

export function studentSendMessage(convId: string, text: string) {
  return api.post<{ success: boolean; messageId: string }>(`/student/messages/${convId}`, { text })
}

// ── Apply to Job ───────────────────────────────────────────

export function applyToJobDirect(jobId: string) {
  return api.post<{ success: boolean; applicationId: string; message?: string }>('/student/applications', { jobId })
}

export function getStudentApplicationsList() {
  return api.get<{ id: string; jobId: string; jobTitle: string; company: string; status: string; appliedAt: string }[]>('/student/applications')
}

