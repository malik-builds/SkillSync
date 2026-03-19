import { StudentProfile } from "@/types/profile";
import { SkillBadge } from "./SkillBadge";
import { GlassCard } from "@/components/ui/GlassCard";
import { verifyGithubProfile } from "@/lib/api/student-api";
import { CheckCircle2, User } from "lucide-react";
import { useState } from "react";

interface SkillsTabProps {
    profile: StudentProfile;
    onRefresh?: () => void;
}

export function SkillsTab({ profile, onRefresh }: SkillsTabProps) {
    const verifiedSkills = (profile.skills || []).filter((s) => s.verified);
    const manualSkills = (profile.skills || []).filter((s) => !s.verified);
    const [verifying, setVerifying] = useState(false);
    const [verifyMessage, setVerifyMessage] = useState("");
    const [verifyError, setVerifyError] = useState("");

    const runGithubVerification = async () => {
        try {
            setVerifying(true);
            setVerifyError("");
            setVerifyMessage("");
            const result = await verifyGithubProfile();
            setVerifyMessage(`GitHub verification complete. ${result.verifiedSkills.length} verified skill(s) found.`);
            onRefresh?.();
        } catch (e: any) {
            setVerifyError(e?.error || "GitHub verification failed.");
        } finally {
            setVerifying(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Verified Skills */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 rounded-lg bg-blue-50">
                        <CheckCircle2 size={18} className="text-blue-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Verified Skills</h3>
                    <span className="text-sm text-gray-500 font-medium">
                        ({verifiedSkills.length})
                    </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {verifiedSkills.map((skill, i) => (
                        <SkillBadge key={`v-${skill.name}-${i}`} skill={skill} />
                    ))}
                </div>
            </section>

            {/* Self-Reported Skills */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 rounded-lg bg-gray-100">
                        <User size={18} className="text-gray-500" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Self-Reported</h3>
                    <span className="text-sm text-gray-500 font-medium">
                        ({manualSkills.length})
                    </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {manualSkills.map((skill, i) => (
                        <SkillBadge key={`m-${skill.name}-${i}`} skill={skill} />
                    ))}

                    {/* Add New Skill CTA */}
                    <button className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 hover:bg-white text-gray-500 hover:text-gray-900 transition-colors group">
                        <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center group-hover:bg-blue-50 border border-gray-200 group-hover:border-blue-100 transition-colors">
                            +
                        </span>
                        <span className="text-sm font-medium">Add Skill</span>
                    </button>
                </div>
            </section>

            <GlassCard className="p-4 bg-blue-50 border-blue-100 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <CheckCircle2 size={20} className="text-blue-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 text-sm">Want to verify your self-reported skills?</h4>
                        <p className="text-xs text-blue-600/80">Link a GitHub repository or upload a project to get verified.</p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <button
                        onClick={() => void runGithubVerification()}
                        disabled={verifying}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-sm disabled:bg-blue-300 disabled:cursor-not-allowed"
                    >
                        {verifying ? "Verifying..." : "Verify Now"}
                    </button>
                    {verifyMessage && <p className="text-xs text-green-700">{verifyMessage}</p>}
                    {verifyError && <p className="text-xs text-red-600">{verifyError}</p>}
                </div>
            </GlassCard>
        </div>
    );
}
