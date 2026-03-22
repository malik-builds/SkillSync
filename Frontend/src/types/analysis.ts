export interface SkillData {
    subject: string;
    A: number; // You
    B: number; // Market
    fullMark: number;
}

export interface SkillGap {
    id: string;
    name: string;
    category: string;
    priority: "Critical" | "High" | "Medium";
    impact: string;
    missingPercent: number;
}

export interface JobMatch {
    id: string;
    title: string;
    company: string;
    matchScore: number;
    suitabilityPercentage?: number;
    salary: string;
    description: string;
    logo?: string;
}

export interface Recommendation {
    id: string;
    title: string;
    type: "Course" | "Project" | "Certification";
    provider: string;
    duration: string;
    link: string;
    skillId: string;
}
