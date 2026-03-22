export type SkillLevel = "Beginner" | "Intermediate" | "Advanced" | "Expert";
export type SkillSource = "github" | "cv" | "manual";

export interface Skill {
    name: string;
    level?: SkillLevel;
    source?: SkillSource;
    verified?: boolean;
    icon?: string; // Optional URL or icon name
}

export interface ProjectDNS {
    complexity: "Low" | "Medium" | "High";
    quality: "A" | "B" | "C";
    topLanguage: string;
    topLanguagePercentage: number;
}

export interface Project {
    id: string;
    title: string;
    description: string;
    techStack: string[];
    dna?: ProjectDNS;
    repoUrl?: string;
    demoUrl?: string;
    image?: string;
}

export interface Experience {
    id: string;
    role: string;
    company: string;
    duration: string;
    type?: "Internship" | "Full-time" | "Part-time" | "Freelance";
    description?: string;
    skillsUsed?: string[];
}

export interface Education {
    id: string;
    institution: string;
    degree: string;
    year?: string;
    grade?: string;
    modules?: string[];
}

export interface SocialLinks {
    github?: string;
    linkedin?: string;
    website?: string;
    twitter?: string;
}

export interface StudentProfile {
    id: string;
    name: string;
    email?: string;
    title?: string;
    location?: string;
    avatarUrl?: string;
    availability?: "looking" | "open" | "not_looking";
    profileStrength?: number;
    isVerifiedStudent?: boolean;
    socials?: SocialLinks;
    skills: Skill[];
    projects?: Project[];
    experience?: Experience[];
    education?: Education[];
    bio?: string;
    // Backend-specific fields
    university?: string;
    course?: string;
    githubUrl?: string;
    githubStats?: {
        repos: number;
        commits: number;
    };
    gapScore?: number;
}

