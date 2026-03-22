"use client";

import { motion } from "framer-motion";
import { GraduationCap, Briefcase, Building2, ChevronRight, CheckCircle2, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // Correct import for App Router
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
    const router = useRouter();

    const marketingContent = (
        <div className="space-y-8 relative z-10">
            <div className="space-y-4">
                <h1 className="text-4xl font-bold text-white tracking-tight leading-tight">
                    Join the <span className="text-blue-200">Future of Hiring</span>
                </h1>
                <p className="text-lg text-blue-100/90 leading-relaxed max-w-md">
                    Whether you&apos;re a student building a career, or a company building a team — SkillSync bridges the gap.
                </p>
            </div>

            <div className="space-y-4 pt-4">
                {[
                    { text: "AI-Verified Skills Badge", icon: CheckCircle2 },
                    { text: "Instant Job Matching", icon: CheckCircle2 },
                    { text: "Curriculum Intelligence", icon: CheckCircle2 },
                ].map((item, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + idx * 0.1 }}
                        className="flex items-center gap-3 bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10"
                    >
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300">
                            <item.icon size={20} />
                        </div>
                        <span className="text-white font-medium">{item.text}</span>
                    </motion.div>
                ))}
            </div>
        </div>
    );

    const RoleButton = ({
        icon: Icon,
        title,
        description,
        onClick,
        colorClass
    }: {
        icon: LucideIcon,
        title: string,
        description: string,
        onClick: () => void,
        colorClass: string
    }) => (
        <button
            onClick={onClick}
            className="w-full group flex items-center justify-between p-5 rounded-2xl border border-gray-200 hover:border-blue-500 bg-white hover:bg-blue-50/50 transition-all duration-300 text-left shadow-sm hover:shadow-md"
        >
            <div className="flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-colors", colorClass)}>
                    <Icon size={24} />
                </div>
                <div>
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                        {title}
                    </h3>
                    <p className="text-sm text-gray-500">
                        {description}
                    </p>
                </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
        </button>
    );

    return (
        <AuthSplitLayout marketingContent={marketingContent}>
            <div className="w-full max-w-md mx-auto space-y-8">
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold text-gray-900">Get Started</h2>
                    <p className="text-gray-500">Select your role to continue setup.</p>
                </div>

                <div className="space-y-4">
                    <RoleButton
                        icon={GraduationCap}
                        title="I'm a Student"
                        description="Get verified & find jobs."
                        onClick={() => router.push('/register/student')}
                        colorClass="bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white"
                    />

                    <RoleButton
                        icon={Briefcase}
                        title="I'm a Recruiter"
                        description="Hire pre-vetted talent."
                        onClick={() => router.push('/register/recruiter')}
                        colorClass="bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white"
                    />

                    <RoleButton
                        icon={Building2}
                        title="I'm a University"
                        description="Track student outcomes and hiring insights."
                        onClick={() => router.push('/contact-university')}
                        colorClass="bg-pink-100 text-pink-600 group-hover:bg-pink-600 group-hover:text-white"
                    />
                </div>

                <div className="text-center pt-4">
                    <p className="text-sm text-gray-500">
                        Already have an account?{" "}
                        <Link href="/login" className="text-blue-600 font-bold hover:underline">
                            Log In
                        </Link>
                    </p>
                </div>
            </div>
        </AuthSplitLayout>
    );
}
