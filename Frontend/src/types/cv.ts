export type CVTemplate = "minimalist" | "corporate" | "creative";

export interface ContactInfo {
    phone: string;
    email: string;
    linkedin: string;
    github: string;
    website: string;
    location: string;
}

export interface CVEducation {
    id: string;
    institution: string;
    degree: string;
    year: string;
    gpa?: string;
}

export interface CVExperience {
    id: string;
    role: string;
    company: string;
    duration: string;
    description: string; // Bullet points as a single string or array? Let's use string for textarea
    bullets: string[];
}

export interface CVSkill {
    category: string;
    items: string[];
}

export interface CVProject {
    id: string;
    title: string;
    description: string;
    techStack: string[];
    link?: string;
}

export interface CVProfile {
    fullName: string;
    title: string;
    summary: string;
    contact: ContactInfo;
    experience: CVExperience[];
    education: CVEducation[];
    skills: CVSkill[];
    projects: CVProject[];
}

export interface CVAnalysis {
    score: number;
    atsCompatibility: "High" | "Medium" | "Low";
    criticalIssues: string[];
    foundKeywords: string[];
    missingKeywords: string[];
    formattingScore: number;
}
