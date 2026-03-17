// ============================================================
// University API — All university dashboard endpoints
// ============================================================

import { api } from './client'
import {
  DashboardAlert,
  RadarDataPoint,
  SkillBarDataPoint,
  PlacementDonutSegment,
  ProgrammePlacement,
  TopEmployer,
  Intervention,
  UniversityDashboardStats,
  Programme,
  MissingSkill,
  ScoreDistributionBin,
  StudentStats,
  ProgrammeData,
  CompanyData,
  RoleData,
  PlacementFunnel,
  DurationBreakdown,
  PartnerCompany,
  PartnerStats,
  CurriculumSkillData,
  CurriculumStats,
  UniTeamMember,
  UniPendingInvite,
} from '@/types/university'

// ── Dashboard ──────────────────────────────────────────────

export interface UniversityDashboardData {
  stats: UniversityDashboardStats
  alerts: DashboardAlert[]
  radarData: RadarDataPoint[]
  skillBarData: SkillBarDataPoint[]
  placementDonut: PlacementDonutSegment[]
  programmePlacements: ProgrammePlacement[]
  topEmployers: TopEmployer[]
  interventions: Intervention[]
}

export function getUniversityDashboard() {
  return api.get<UniversityDashboardData>('/university/dashboard')
}

export function getUniversityStats() {
  return api.get<UniversityDashboardStats>('/university/dashboard/stats')
}

export function getAlerts() {
  return api.get<DashboardAlert[]>('/university/dashboard/alerts')
}

export function dismissAlert(alertId: string) {
  return api.put<{ success: boolean }>(`/university/dashboard/alerts/${alertId}/dismiss`)
}

export function getRadarData() {
  return api.get<RadarDataPoint[]>('/university/dashboard/skill-gap-radar')
}

export function getSkillBarData() {
  return api.get<SkillBarDataPoint[]>('/university/dashboard/skill-bar')
}

export function getPlacementDonut() {
  return api.get<PlacementDonutSegment[]>('/university/dashboard/placement-summary')
}

export function getProgrammePlacements() {
  return api.get<ProgrammePlacement[]>('/university/dashboard/programme-placements')
}

export function getTopEmployers() {
  return api.get<TopEmployer[]>('/university/dashboard/top-employers')
}

export function getInterventions() {
  return api.get<Intervention[]>('/university/dashboard/interventions')
}

export function createIntervention(data: Omit<Intervention, 'id'>) {
  return api.post<Intervention>('/university/dashboard/interventions', data)
}

// ── Students ───────────────────────────────────────────────

export interface StudentsOverviewData {
  stats: StudentStats
  programmes: Programme[]
  missingSkills: MissingSkill[]
  scoreDistribution: ScoreDistributionBin[]
  scoreByProgramme: Record<string, ScoreDistributionBin[]>
}

export function getStudentsOverview() {
  return api.get<StudentsOverviewData>('/university/students')
}

export function getStudentStats() {
  return api.get<StudentStats>('/university/students/stats')
}

export function getProgrammes() {
  return api.get<Programme[]>('/university/students/programmes')
}

export function getScoreDistribution(programme?: string) {
  const query = programme ? `?programme=${encodeURIComponent(programme)}` : ''
  return api.get<ScoreDistributionBin[]>(`/university/students/score-distribution${query}`)
}

export function getMissingSkills() {
  return api.get<MissingSkill[]>('/university/students/missing-skills')
}

// ── Placements ─────────────────────────────────────────────

export interface PlacementsOverviewData {
  stats: {
    totalEligible: number
    activelySeeking: number
    secured: number
    overallRate: number
  }
  funnel: PlacementFunnel[]
  programmes: ProgrammeData[]
  companies: CompanyData[]
  roles: RoleData[]
  durations: DurationBreakdown[]
}

export function getPlacementsOverview(year?: string) {
  const query = year ? `?year=${year}` : ''
  return api.get<PlacementsOverviewData>(`/university/placements${query}`)
}

export function getPlacementFunnel() {
  return api.get<PlacementFunnel[]>('/university/placements/funnel')
}

export function getPlacementsByProgramme(year?: string) {
  const query = year ? `?year=${year}` : ''
  return api.get<ProgrammeData[]>(`/university/placements/by-programme${query}`)
}

export function getTopCompanies() {
  return api.get<CompanyData[]>('/university/placements/top-companies')
}

export function getPlacementsByRole() {
  return api.get<RoleData[]>('/university/placements/by-role')
}

export function getPlacementsByDuration() {
  return api.get<DurationBreakdown[]>('/university/placements/by-duration')
}

// ── Partners ───────────────────────────────────────────────

export interface PartnerFilters {
  status?: string
  industry?: string
  size?: string
  search?: string
}

export function getPartners(filters?: PartnerFilters) {
  const params = new URLSearchParams()
  if (filters?.status) params.set('status', filters.status)
  if (filters?.industry) params.set('industry', filters.industry)
  if (filters?.size) params.set('size', filters.size)
  if (filters?.search) params.set('search', filters.search)
  const query = params.toString() ? `?${params}` : ''
  return api.get<{ companies: PartnerCompany[]; stats: PartnerStats }>(`/university/partners${query}`)
}

export function getPartnerStats() {
  return api.get<PartnerStats>('/university/partners/stats')
}

export function addPartner(data: Omit<PartnerCompany, 'id'>) {
  return api.post<PartnerCompany>('/university/partners', data)
}

export function contactPartner(partnerId: string, message: string) {
  return api.post<{ success: boolean }>(`/university/partners/${partnerId}/contact`, { message })
}

// ── Curriculum ─────────────────────────────────────────────

export interface CurriculumOverviewData {
  stats: CurriculumStats
  skills: CurriculumSkillData[]
}

export function getCurriculumOverview(params?: { programme?: string; severity?: string; category?: string }) {
  const urlParams = new URLSearchParams()
  if (params?.programme) urlParams.set('programme', params.programme)
  if (params?.severity) urlParams.set('severity', params.severity)
  if (params?.category) urlParams.set('category', params.category)
  const query = urlParams.toString() ? `?${urlParams}` : ''
  return api.get<CurriculumOverviewData>(`/university/curriculum/skills${query}`)
}

export function getCurriculumStats() {
  return api.get<CurriculumStats>('/university/curriculum/stats')
}

export function getSkillDetail(skillId: string) {
  return api.get<CurriculumSkillData & { relatedCourses: string[]; recommendations: string[] }>(
    `/university/curriculum/skills/${skillId}/detail`
  )
}

// ── Settings ───────────────────────────────────────────────

export interface UniversityAccountSettings {
  institutionName: string
  website: string
  address: string
  personalName: string
  personalEmail: string
  personalRole: string
  personalPhone: string
}

export function getUniversityAccount() {
  return api.get<UniversityAccountSettings>('/university/settings/account')
}

export function updateUniversityAccount(data: Partial<UniversityAccountSettings>) {
  return api.put<UniversityAccountSettings>('/university/settings/account', data)
}

export function getUniversityTeam() {
  return api.get<{ members: UniTeamMember[]; invites: UniPendingInvite[] }>('/university/settings/team')
}

export function inviteUniversityTeamMember(email: string, role: string, department: string) {
  return api.post<{ success: boolean }>('/university/settings/team/invite', { email, role, department })
}

export function removeUniversityTeamMember(memberId: string) {
  return api.delete<{ success: boolean }>(`/university/settings/team/${memberId}`)
}

export function revokeUniversityInvite(inviteId: string) {
  return api.delete<{ success: boolean }>(`/university/settings/team/invites/${inviteId}`)
}

export function getUniversityNotificationSettings() {
  return api.get<Record<string, boolean>>('/university/settings/notifications')
}

export function updateUniversityNotificationSettings(settings: Record<string, boolean>) {
  return api.put<Record<string, boolean>>('/university/settings/notifications', settings)
}

export function getDataGovernanceSettings() {
  return api.get<Record<string, unknown>>('/university/settings/data')
}

export function updateDataGovernanceSettings(settings: Record<string, unknown>) {
  return api.put<Record<string, unknown>>('/university/settings/data', settings)
}

export function changeUniversityPassword(data: { currentPassword: string; newPassword: string }) {
  return api.post<{ success: boolean }>('/university/settings/change-password', data)
}
