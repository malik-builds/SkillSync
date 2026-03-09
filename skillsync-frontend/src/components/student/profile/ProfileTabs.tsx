"use client";

import { StudentProfile } from "@/types/profile";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SkillsTab } from "./SkillsTab";
import { ProjectsTab } from "./ProjectsTab";
import { ExperienceTab } from "./ExperienceTab";
import { EducationTab } from "./EducationTab";

interface ProfileTabsProps {
    profile: StudentProfile;
}

const TABS = [
    { id: "skills", label: "Skills" },
    { id: "projects", label: "Projects" },
    { id: "experience", label: "Experience" },
    { id: "education", label: "Education" },
    { id: "personal", label: "Personal" },
];

export function ProfileTabs({ profile }: ProfileTabsProps) {
    const [activeTab, setActiveTab] = useState("skills");

    return (
        <div className="min-h-screen">
            {/* Static Tab Nav */}
            <div className="py-6">
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 shrink-0 ${isActive
                                    ? "text-gray-900 bg-white shadow-sm ring-1 ring-gray-200"
                                    : "text-gray-500 hover:text-gray-900 hover:bg-white/50"
                                    }`}
                            >
                                {tab.label}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabIndicator"
                                        className="absolute inset-0 rounded-full"
                                        initial={false}
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <div className="mt-4 pb-20">
                <AnimatePresence mode="wait">
                    {activeTab === "skills" && (
                        <motion.div key="skills" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                            <SkillsTab profile={profile} />
                        </motion.div>
                    )}
                    {activeTab === "projects" && (
                        <motion.div key="projects" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                            <ProjectsTab profile={profile} />
                        </motion.div>
                    )}
                    {activeTab === "experience" && (
                        <motion.div key="experience" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                            <ExperienceTab profile={profile} />
                        </motion.div>
                    )}
                    {activeTab === "education" && (
                        <motion.div key="education" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                            <EducationTab profile={profile} />
                        </motion.div>
                    )}
                    {activeTab === "personal" && (
                        <div className="flex items-center justify-center h-48 text-gray-500">
                            Personal details tab content placeholder
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
