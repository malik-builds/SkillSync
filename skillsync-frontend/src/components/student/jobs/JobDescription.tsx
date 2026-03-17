"use client";

import { JobPosting } from "@/types/jobs";
import { GlassCard } from "@/components/ui/GlassCard";
import { CheckCircle2 } from "lucide-react";

interface JobDescriptionProps {
    job: JobPosting;
}

export function JobDescription({ job }: JobDescriptionProps) {
    return (
        <div className="space-y-6">
            <GlassCard className="p-6 md:p-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4">About the Role</h2>
                <div className="prose text-gray-600 text-sm leading-relaxed mb-8">
                    <p>
                        We are looking for a passionate {job.title} to join our growing team. You will be responsible for building scalable web applications and collaborating with cross-functional teams to define, design, and ship new features.
                    </p>
                    <p className="mt-4">
                        If you love writing clean, efficient, and reusable code, we&apos;d love to meet you!
                    </p>
                </div>

                <h3 className="text-md font-bold text-gray-900 mb-4">Key Responsibilities</h3>
                <ul className="space-y-3 mb-8">
                    {job.responsibilities.map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                            <CheckCircle2 size={16} className="text-blue-500 mt-0.5 shrink-0" />
                            {item}
                        </li>
                    ))}
                </ul>

                <h3 className="text-md font-bold text-gray-900 mb-4">Requirements</h3>
                <ul className="space-y-3 mb-8">
                    {job.requirements.map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                            {item}
                        </li>
                    ))}
                </ul>

                <h3 className="text-md font-bold text-gray-900 mb-4">Benefits</h3>
                <ul className="space-y-3">
                    {job.benefits.map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                            {item}
                        </li>
                    ))}
                </ul>
            </GlassCard>
        </div>
    );
}
