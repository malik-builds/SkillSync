"use client";

import { useState, useEffect } from "react";
import { CVProfile, CVTemplate } from "@/types/cv";
import { TemplateSelector } from "./TemplateSelector";
import { LiveCVPreview } from "./LiveCVPreview";
import { GlassCard } from "@/components/ui/GlassCard";
import { Sparkles, Save, Download } from "lucide-react";
import { useApi } from "@/lib/hooks/useApi";
import { getCVProfile } from "@/lib/api/student-api";

const EMPTY_PROFILE: CVProfile = {
    fullName: "",
    title: "",
    summary: "",
    contact: { email: "", phone: "", location: "", linkedin: "", github: "", website: "" },
    experience: [],
    education: [],
    skills: [],
    projects: []
};

export function CVBuilder() {
    const { data: savedProfile } = useApi<CVProfile>(() => getCVProfile());
    const [profile, setProfile] = useState<CVProfile>(EMPTY_PROFILE);

    useEffect(() => {
        if (savedProfile) setProfile(savedProfile);
    }, [savedProfile]);
    const [template, setTemplate] = useState<CVTemplate>("minimalist");
    const [activeSection, setActiveSection] = useState("experience");

    const handleInputChange = (field: keyof CVProfile['contact'] | 'fullName' | 'title' | 'summary', value: string) => {
        if (['fullName', 'title', 'summary'].includes(field)) {
            setProfile(prev => ({ ...prev, [field]: value }));
        } else {
            setProfile(prev => ({
                ...prev,
                contact: { ...prev.contact, [field]: value }
            }));
        }
    };

    const handleExperienceChange = (id: string, field: keyof CVProfile['experience'][0], value: string) => {
        setProfile(prev => ({
            ...prev,
            experience: prev.experience.map(exp =>
                exp.id === id ? { ...exp, [field]: value } : exp
            )
        }));
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
            {/* Left Column: Editor */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                <TemplateSelector selectedTemplate={template} onSelect={setTemplate} />

                {/* Editor Form */}
                <div className="space-y-6">
                    {/* Personal Info */}
                    <GlassCard className="p-6 bg-white border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Personal Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs text-gray-500 font-medium">Full Name</label>
                                <input
                                    type="text"
                                    value={profile.fullName}
                                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-gray-500 font-medium">Professional Title</label>
                                <input
                                    type="text"
                                    value={profile.title}
                                    onChange={(e) => handleInputChange('title', e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="mt-4 space-y-2">
                            <div className="flex justify-between">
                                <label className="text-xs text-gray-500 font-medium">Professional Summary</label>
                                <button className="text-xs text-purple-600 flex items-center gap-1 hover:text-purple-700 font-bold">
                                    <Sparkles size={12} /> AI Generate
                                </button>
                            </div>
                            <textarea
                                value={profile.summary}
                                onChange={(e) => handleInputChange('summary', e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none h-24 resize-none transition-all"
                            />
                        </div>
                    </GlassCard>

                    {/* Experience (Simplified for Demo) */}
                    <GlassCard className="p-6 bg-white border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Experience</h3>
                            <button className="text-sm text-blue-600 font-bold hover:text-blue-700 transition-colors">+ Add Role</button>
                        </div>
                        {profile.experience.map(exp => (
                            <div key={exp.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3 relative group hover:shadow-sm transition-all">
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        value={exp.role}
                                        onChange={(e) => handleExperienceChange(exp.id, 'role', e.target.value)}
                                        placeholder="Role"
                                        className="bg-transparent border-b border-gray-300 pb-1 text-gray-900 font-bold focus:border-blue-500 outline-none w-full placeholder-gray-400"
                                    />
                                    <input
                                        type="text"
                                        value={exp.company}
                                        onChange={(e) => handleExperienceChange(exp.id, 'company', e.target.value)}
                                        placeholder="Company"
                                        className="bg-transparent border-b border-gray-300 pb-1 text-gray-500 text-right focus:border-blue-500 outline-none w-full placeholder-gray-400 font-medium"
                                    />
                                </div>
                                <div className="relative group/edit">
                                    <textarea
                                        value={exp.description}
                                        onChange={(e) => handleExperienceChange(exp.id, 'description', e.target.value)}
                                        placeholder="Description"
                                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-600 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none h-20 resize-none transition-all"
                                    />
                                    <button className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors opacity-0 group-hover/edit:opacity-100">
                                        <Sparkles size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </GlassCard>
                </div>
            </div>

            {/* Right Column: Live Preview */}
            <div className="flex-1 lg:h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Live Preview</h2>
                    <div className="flex gap-2">
                        <button className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium border border-gray-300 flex items-center gap-2">
                            <Save size={14} /> Save Draft
                        </button>
                        <button className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2">
                            <Download size={14} /> Download PDF
                        </button>
                    </div>
                </div>
                <div className="flex-1 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-lg">
                    <LiveCVPreview profile={profile} template={template} />
                </div>
            </div>
        </div>
    );
}
