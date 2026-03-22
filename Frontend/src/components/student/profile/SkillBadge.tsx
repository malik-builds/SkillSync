import { Skill } from "@/types/profile";
import { CheckCircle2, FileText, User } from "lucide-react";

interface SkillBadgeProps {
    skill: Skill;
    onRemove?: () => void;
    removing?: boolean;
}

export function SkillBadge({ skill, onRemove, removing = false }: SkillBadgeProps) {
    const sourceConfig = {
        github: {
            icon: CheckCircle2,
            bg: "bg-green-50",
            border: "border-green-100",
            text: "text-green-600",
            label: "GitHub Verified",
        },
        cv: {
            icon: FileText,
            bg: "bg-blue-50",
            border: "border-blue-100",
            text: "text-blue-600",
            label: "CV Extracted",
        },
        manual: {
            icon: User,
            bg: "bg-gray-100",
            border: "border-gray-200",
            text: "text-gray-600",
            label: "Self-Reported",
        },
    };

    const config = sourceConfig[skill.source as keyof typeof sourceConfig] || sourceConfig.cv;
    const Icon = config.icon;

    return (
        <div className={`relative group p-3 rounded-xl border bg-white hover:bg-gray-50 transition-colors shadow-sm ${config.border}`}>
            <div className="flex items-center gap-3">
                {/* Icon Box */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${config.bg} ${config.text}`}>
                    {skill.icon ? (
                        <img src={skill.icon} alt={skill.name} className="w-6 h-6 object-contain" />
                    ) : (
                        <Icon size={20} />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                        <h4 className="font-semibold text-gray-900 truncate pr-2">{skill.name}</h4>
                        {skill.verified && (
                            <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <span className={config.text}>{config.label}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span className="text-gray-500">{skill.level || 'Intermediate'}</span>
                    </div>
                </div>
            </div>

            {onRemove && (
                <div className="mt-3 pt-2 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onRemove}
                        disabled={removing}
                        className="text-[10px] px-2 py-0.5 rounded-md border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                        {removing ? "..." : "Remove"}
                    </button>
                </div>
            )}

            {/* Tooltip for verification (Optional, can be added later) */}
        </div>
    );
}
