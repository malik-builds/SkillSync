export interface JobPosting {
    id: string;
    title: string;
    company: string;
    logo?: string;
    location: string;
    type: "Full-time" | "Contract" | "Internship" | "Remote";
    postedAt: string;
    salaryRange: string;
    description: string; // Rich text or HTML string
    responsibilities: string[];
    requirements: string[];
    benefits: string[];
}

export interface JobMatchAndAnalysis {
    matchScore: number;
    strengths: { id: string; name: string; verified: boolean }[];
    gaps: { id: string; name: string; learningPathId?: string }[];
    analysisText: string;
}
