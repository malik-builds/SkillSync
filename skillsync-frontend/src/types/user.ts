// ============================================================
// User & Authentication Types — Production-Ready
// ============================================================

export type UserRole = 'student' | 'recruiter' | 'university'

// Onboarding step completion tracking
export interface OnboardingStatus {
  cvUploaded: boolean
  githubConnected: boolean
  targetRoleSet: boolean
  completed: boolean
}

// Core user record returned by API
export interface User {
  id: string
  fullName: string
  email: string
  role: UserRole
  avatar?: string

  // Account status
  emailVerified: boolean
  createdAt: string
  updatedAt: string

  // Student-specific fields
  university?: string
  programme?: string
  graduationYear?: number

  // Onboarding / profile status
  onboarding: OnboardingStatus
  profileCompletion: number // 0-100

  // Connected services
  githubUsername?: string

  // Preferences
  targetRole?: string

  // CV
  cvId?: string
  cvFileName?: string

  // Recruiter-specific
  companyId?: string
  companyName?: string

  // University-specific
  universityId?: string
}

// Auth state for context provider
export interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

// ============================================================
// API Request / Response Types
// ============================================================

// Sign Up
export interface SignUpRequest {
  fullName: string
  email: string
  password: string
  role: UserRole
  university?: string
  programme?: string
  graduationYear?: number
  jobTitle?: string
  faculty?: string
  message?: string
  termsAccepted: boolean
}

export interface SignUpResponse {
  token: string
  user: User
}

// Sign In
export interface SignInRequest {
  email: string
  password: string
  role?: UserRole
  rememberMe: boolean
}

export interface SignInResponse {
  token: string
  user: User
  redirect?: string
}

// Email Verification
export interface VerifyEmailResponse {
  success: boolean
  message: string
  user?: User
  token?: string
}

// Password Reset
export interface ForgotPasswordRequest {
  email: string
}

export interface ForgotPasswordResponse {
  success: boolean
  message: string
}

export interface ResetPasswordRequest {
  token: string
  newPassword: string
}

export interface ResetPasswordResponse {
  success: boolean
  message: string
}

// Onboarding
export interface CVUploadResponse {
  success: boolean
  cvId: string
  fileName: string
  extractedData: {
    skills: string[]
    experience: { title: string; company: string; duration: string }[]
    education: { degree: string; institution: string }[]
    projects: { name: string; description: string }[]
  }
}

export interface GitHubConnectResponse {
  success: boolean
  githubUsername: string
  reposCount: number
  commitsLast6Months: number
  detectedSkills: { skill: string; confidence: number }[]
}


export interface AnalysisResponse {
  extracted_data: {
    skills: string[]
    experience: { title: string; company: string; duration: string }[]
    education_history: { degree: string; institution: string }[]
    name?: string
    contact_info?: {
      email?: string
      github?: string
    }
  }
  market_requirements: {
    must_have: string[]
    nice_to_have: string[]
    salary_range?: string
  }
  gap_report: {
    score: number
    status: string
    missing_critical: string[]
    recommendations: string[]
  }
  github_report?: any
  status: string
}
export interface SelectTargetRoleRequest {
  role: string
}

// API Error
export interface ApiError {
  success: false
  error: string
  code: number
  details?: Record<string, string>
}
