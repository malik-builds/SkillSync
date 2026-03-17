import { ShieldCheck, CheckCircle2 } from "lucide-react";

interface TrustBadgeProps {
    type: "verified_student" | "github_verified" | "self_reported";
    className?: string;
}

export function TrustBadge({ type, className = "" }: TrustBadgeProps) {
    const config = {
        verified_student: {
            icon: ShieldCheck,
            text: "Verified Student",
            style: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        },
        github_verified: {
            icon: CheckCircle2,
            text: "GitHub Verified",
            style: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        },
        self_reported: {
            icon: CheckCircle2,
            text: "Self-Reported",
            style: "bg-gray-500/10 text-gray-400 border-gray-500/20",
        },
    };

    const { icon: Icon, text, style } = config[type];

    return (
        <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${style} ${className}`}
        >
            <Icon size={12} />
            <span>{text}</span>
        </div>
    );
}
