"use client";

import { motion } from "framer-motion";
import {
    Briefcase, FileText, PenTool, CheckCircle2, Map, Building2,
    Users, Search, ShieldCheck, MessageSquare, BarChart3,
    LineChart, PieChart, TrendingUp, Target, FileBarChart, Activity
} from "lucide-react";

const FEATURES = [
    { title: "Job Matching", desc: "Find jobs that match your skills with % match scores.", icon: Briefcase, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "CV Management", desc: "Seamless upload & AI parsing for your documents.", icon: FileText, color: "text-purple-500", bg: "bg-purple-500/10" },
    { title: "Smart CV Builder", desc: "Create ATS-friendly CVs that get noticed.", icon: PenTool, color: "text-green-500", bg: "bg-green-500/10" },
    { title: "Verified Skill Scoring", desc: "Objective skill ratings backed by data.", icon: CheckCircle2, color: "text-orange-500", bg: "bg-orange-500/10" },
    { title: "Personalized Pathways", desc: "Custom course recommendations for growth.", icon: Map, color: "text-pink-500", bg: "bg-pink-500/10" },
    { title: "Job Posting", desc: "Post jobs with required skill sets easily.", icon: Building2, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { title: "AI Candidate Matching", desc: "Get ranked candidates automatically.", icon: Users, color: "text-teal-500", bg: "bg-teal-500/10" },
    { title: "Candidate Search", desc: "Advanced filtering and deep search tools.", icon: Search, color: "text-cyan-500", bg: "bg-cyan-500/10" },
    { title: "Skill Insights", desc: "See proof behind every skill claim.", icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "Communication Tools", desc: "Direct messaging with candidates.", icon: MessageSquare, color: "text-violet-500", bg: "bg-violet-500/10" },
    { title: "Recruitment Analytics", desc: "Track your hiring performance.", icon: BarChart3, color: "text-rose-500", bg: "bg-rose-500/10" },
    { title: "Curriculum Analytics", desc: "Bridge gaps between teaching & industry.", icon: LineChart, color: "text-amber-500", bg: "bg-amber-500/10" },
    { title: "Student Skill Data", desc: "Aggregate skill data for better insights.", icon: PieChart, color: "text-fuchsia-500", bg: "bg-fuchsia-500/10" },
    { title: "Industry Demand", desc: "Real-time job market trend analysis.", icon: TrendingUp, color: "text-lime-500", bg: "bg-lime-500/10" },
    { title: "Placement Tracking", desc: "Monitor employment outcomes effectively.", icon: Target, color: "text-sky-500", bg: "bg-sky-500/10" },
    { title: "Skill Gap Reports", desc: "Detailed reports for comprehensive admin view.", icon: FileBarChart, color: "text-red-500", bg: "bg-red-500/10" },
    { title: "Engagement Monitoring", desc: "Track platform usage statistics.", icon: Activity, color: "text-yellow-500", bg: "bg-yellow-500/10" },
];

export function Features() {
    return (
        <section id="features" className="min-h-screen py-24 bg-[#F8F7F4] relative overflow-hidden flex flex-col justify-center">
            <div className="container mx-auto px-6 mb-16 text-center z-10">
                <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                    Everything you need to <span className="text-blue-600">stand out</span>
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    Skip the generic CVs. SkillSync gives you tools to prove your worth with data.
                </p>
            </div>

            <div className="flex flex-col gap-8">
                {/* Row 1: Scrolling Left */}
                <FeatureMarquee items={FEATURES.slice(0, 9)} direction="left" speed={40} />

                {/* Row 2: Scrolling Right */}
                <FeatureMarquee items={FEATURES.slice(9)} direction="right" speed={50} />
            </div>

            {/* Fade Edges */}
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#F8F7F4] to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#F8F7F4] to-transparent z-10 pointer-events-none" />
        </section>
    );
}

function FeatureMarquee({ items, direction = "left", speed = 30 }: { items: typeof FEATURES, direction?: "left" | "right", speed?: number }) {
    return (
        <div className="relative flex overflow-hidden">
            <motion.div
                className="flex gap-6 whitespace-nowrap px-6"
                animate={{
                    x: direction === "left" ? ["0%", "-50%"] : ["-50%", "0%"]
                }}
                transition={{
                    repeat: Infinity,
                    ease: "linear",
                    duration: speed
                }}
            >
                {[...items, ...items, ...items].map((feature, i) => ( // Tripled for smoother loop
                    <div
                        key={`${feature.title}-${i}`}
                        className="w-[300px] flex-shrink-0"
                    >
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all h-full flex flex-col items-start gap-4 group">
                            <div className={`p-3 rounded-xl ${feature.bg} text-white group-hover:scale-110 transition-transform duration-300`}>
                                <feature.icon className={`w-6 h-6 ${feature.color}`} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight">{feature.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed whitespace-normal">{feature.desc}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </motion.div>
        </div>
    );
}
