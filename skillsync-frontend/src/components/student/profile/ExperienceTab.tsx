import { StudentProfile } from "@/types/profile";
import { GlassCard } from "@/components/ui/GlassCard";
import { Briefcase, Calendar, Building2 } from "lucide-react";

interface ExperienceTabProps {
    profile: StudentProfile;
}

export function ExperienceTab({ profile }: ExperienceTabProps) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-orange-50">
                        <Briefcase size={18} className="text-orange-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Work Experience</h3>
                </div>
                <button className="px-4 py-2 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-sm font-medium text-gray-700 transition-colors shadow-sm">
                    + Add Role
                </button>
            </div>

            <div className="space-y-6">
                {(profile.experience || []).map((exp) => (
                    <GlassCard key={exp.id} className="p-6 bg-white border border-gray-100 shadow-sm relative group transition-all hover:shadow-md">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                            <div>
                                <h4 className="text-xl font-bold text-gray-900">{exp.role}</h4>
                                <div className="flex items-center gap-2 text-sm text-blue-600 font-medium mt-1">
                                    <Building2 size={14} />
                                    <span>{exp.company}</span>
                                    <span className="w-1 h-1 rounded-full bg-blue-400/50" />
                                    <span className="text-gray-500 flex items-center gap-1">
                                        <Calendar size={12} />
                                        {exp.duration}
                                    </span>
                                </div>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-bold text-blue-700 w-fit">
                                {exp.type}
                            </span>
                        </div>

                        <p className="text-gray-600 text-sm leading-relaxed mb-6 font-medium">
                            {exp.description}
                        </p>

                        <div className="flex flex-wrap gap-2">
                            {(exp.skillsUsed || []).map((skill) => (
                                <span
                                    key={skill}
                                    className="px-3 py-1 rounded-md bg-gray-50 text-xs text-gray-700 font-bold border border-gray-200"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </GlassCard>
                ))}
            </div>
        </div>
    );
}
