"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
    CheckCircle2, Briefcase, FileSearch, TrendingDown,
    Github, Search, UserCheck,
    BarChart3, RefreshCw, Server, Database
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Nano Visual Components ---

const NanoCodeVisual = () => (
    <div className="relative w-full h-full bg-[#0F1115] overflow-hidden flex flex-col items-center justify-center border-b border-white/5">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_24px]" />

        {/* Code Window */}
        <div className="relative w-64 bg-[#0A0A0B] rounded-lg border border-gray-800 shadow-2xl overflow-hidden">
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-gray-800 bg-[#0F1115]">
                <div className="w-2 h-2 rounded-full bg-red-500/50" />
                <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                <div className="w-2 h-2 rounded-full bg-green-500/50" />
                <div className="ml-auto text-[8px] text-gray-500 font-mono">sync_v2.tsx</div>
            </div>
            <div className="p-3 space-y-1.5 font-mono text-[8px] leading-relaxed text-gray-500">
                <div className="flex gap-2"><span className="text-blue-500">import</span> <span className="text-white">Profile</span> <span className="text-blue-500">from</span> <span className="text-green-400">&apos;@/github&apos;</span>;</div>
                <div className="flex gap-2"><span className="text-purple-500">const</span> <span className="text-yellow-400">syncData</span> = <span className="text-blue-500">await</span> fetch();</div>
                <div className="h-px w-full bg-blue-500/20 my-2" />
                <div className="flex items-center justify-between text-[8px] text-blue-400 bg-blue-500/10 p-1 rounded">
                    <span>Syncing Repos...</span>
                    <span>100%</span>
                </div>
            </div>
        </div>

        {/* Floating Badge */}
        <motion.div
            initial={{ y: 0 }} animate={{ y: -5 }} transition={{ repeat: Infinity, repeatType: "reverse", duration: 2 }}
            className="absolute -right-2 bottom-4 bg-[#0A0A0B] border border-blue-500/30 text-blue-400 px-2 py-1 rounded text-[9px] font-bold shadow-[0_0_15px_rgba(59,130,246,0.2)] flex items-center gap-1.5"
        >
            <Github className="w-3 h-3" />
            <span>Connected</span>
        </motion.div>
    </div>
);

const SimpleScanVisual = () => (
    <div className="relative w-full h-full bg-[#0F1115] overflow-hidden flex items-center justify-center border-b border-white/5">
        <div className="w-48 bg-[#0A0A0B] rounded-lg border border-gray-800 p-3 space-y-2 relative z-10">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <span className="text-[10px] text-gray-500 font-mono">analysis.json</span>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
            </div>
            <div className="space-y-1.5">
                <div className="flex justify-between text-[9px]">
                    <span className="text-gray-400">React</span>
                    <span className="text-blue-400">Missing</span>
                </div>
                <div className="w-full h-1 bg-gray-800 rounded-full"><div className="w-[10%] h-full bg-blue-500/30" /></div>

                <div className="flex justify-between text-[9px] mt-1">
                    <span className="text-gray-400">TypeScript</span>
                    <span className="text-green-400">Good</span>
                </div>
                <div className="w-full h-1 bg-gray-800 rounded-full"><div className="w-[80%] h-full bg-green-500" /></div>
            </div>
        </div>
    </div>
);

const SimpleGrowVisual = () => (
    <div className="relative w-full h-full bg-[#0F1115] overflow-hidden flex items-center justify-center border-b border-white/5">
        <div className="space-y-3">
            {[
                { label: 'HTML/CSS', done: true },
                { label: 'JavaScript', done: true },
                { label: 'React Patterns', done: false }
            ].map((step, i) => (
                <div key={i} className="flex items-center gap-3 w-40">
                    <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center border",
                        step.done
                            ? "bg-blue-500/20 border-blue-500 text-blue-500"
                            : "bg-gray-800 border-gray-700 text-gray-500"
                    )}>
                        {step.done ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" />}
                    </div>
                    <div className={cn(
                        "text-[10px] font-medium",
                        step.done ? "text-white" : "text-gray-500"
                    )}>
                        {step.label}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const RecruiterPostVisual = () => (
    <div className="relative w-full h-full bg-[#0F1115] overflow-hidden flex items-center justify-center border-b border-white/5">
        <div className="w-48 bg-[#0A0A0B] rounded border border-purple-500/30 p-3 shadow-lg transform rotate-2">
            <div className="flex justify-between items-start mb-3">
                <div className="text-[10px] font-bold text-white">Senior React Dev</div>
                <div className="bg-purple-500/20 text-purple-400 text-[7px] px-1.5 py-0.5 rounded">Remote</div>
            </div>
            <div className="space-y-1.5 mb-3">
                <div className="h-1 w-full bg-gray-800 rounded" />
                <div className="h-1 w-2/3 bg-gray-800 rounded" />
            </div>
            <div className="flex gap-1 flex-wrap">
                <span className="text-[7px] bg-gray-800 text-gray-400 px-1 py-0.5 rounded border border-gray-700">React</span>
                <span className="text-[7px] bg-gray-800 text-gray-400 px-1 py-0.5 rounded border border-gray-700">TypeScript</span>
                <span className="text-[7px] bg-purple-500/10 text-purple-400 px-1 py-0.5 rounded border border-purple-500/30">Next.js</span>
            </div>
        </div>
        <motion.div
            className="absolute top-8 right-10 w-3 h-3 bg-purple-500 rounded-full blur-[2px]"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
        />
    </div>
);

const RecruiterMatchVisual = () => (
    <div className="relative w-full h-full bg-[#0F1115] overflow-hidden flex items-center justify-center border-b border-white/5">
        <div className="space-y-2 w-48 relative z-10">
            {/* Filter Bar */}
            <div className="flex items-center gap-2 bg-[#0A0A0B] border border-gray-800 p-1.5 rounded mb-2">
                <Search className="w-3 h-3 text-gray-500" />
                <div className="h-1 w-16 bg-gray-800 rounded" />
                <div className="ml-auto w-3 h-3 bg-purple-500/20 rounded-full" />
            </div>

            {/* Candidate List */}
            <div className="bg-[#0A0A0B] border border-gray-800 rounded divide-y divide-gray-800/50">
                <div className="p-2 flex items-center gap-2 opacity-50">
                    <div className="w-5 h-5 rounded-full bg-gray-700" />
                    <div className="h-1.5 w-12 bg-gray-700 rounded" />
                </div>
                <motion.div
                    initial={{ backgroundColor: "rgba(168,85,247,0)" }}
                    animate={{ backgroundColor: "rgba(168,85,247,0.1)" }}
                    className="p-2 flex items-center gap-2 border-l-2 border-purple-500 bg-purple-500/5"
                >
                    <div className="w-5 h-5 rounded-full bg-purple-500 text-[8px] text-white flex items-center justify-center font-bold">98</div>
                    <div>
                        <div className="h-1.5 w-16 bg-white/20 rounded mb-1" />
                        <div className="h-1 w-8 bg-purple-400/20 rounded" />
                    </div>
                    <CheckCircle2 className="w-3 h-3 text-purple-400 ml-auto" />
                </motion.div>
                <div className="p-2 flex items-center gap-2 opacity-50">
                    <div className="w-5 h-5 rounded-full bg-gray-700" />
                    <div className="h-1.5 w-10 bg-gray-700 rounded" />
                </div>
            </div>
        </div>
    </div>
);

const RecruiterHireVisual = () => (
    <div className="relative w-full h-full bg-[#0F1115] overflow-hidden flex items-center justify-center border-b border-white/5">
        <div className="bg-[#0A0A0B] rounded-xl border border-green-500/30 p-4 shadow-[0_0_30px_rgba(34,197,94,0.1)] flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-800 bg-[url('https://i.pravatar.cc/100?img=33')] bg-cover border border-white/10" />
            <div>
                <div className="h-2 w-20 bg-gray-800 rounded mb-1.5" />
                <div className="h-1.5 w-12 bg-green-500/20 rounded-full" />
            </div>
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center ml-2 shadow-lg">
                <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
        </div>
    </div>
);

const UniIntegrateVisual = () => (
    <div className="relative w-full h-full bg-[#0F1115] overflow-hidden flex items-center justify-center border-b border-white/5">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center">
                <Server className="w-6 h-6 text-gray-500" />
            </div>
            <div className="flex gap-1">
                <div className="w-1 h-1 bg-pink-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1 h-1 bg-pink-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1 h-1 bg-pink-500 rounded-full animate-bounce" />
            </div>
            <div className="w-12 h-12 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center">
                <Database className="w-6 h-6 text-pink-500" />
            </div>
        </div>
    </div>
);
const UniLiveVisual = () => (
    <div className="relative w-full h-full bg-[#0F1115] overflow-hidden flex items-center justify-center border-b border-white/5">
        <div className="flex gap-2 items-end h-24 px-8 w-full justify-center">
            <div className="w-8 bg-gray-800 rounded-t h-[40%] relative group"><div className="absolute -top-4 w-full text-center text-[8px] text-gray-500">2023</div></div>
            <div className="w-8 bg-gray-700 rounded-t h-[60%] relative group"><div className="absolute -top-4 w-full text-center text-[8px] text-gray-500">2024</div></div>
            <div className="w-8 bg-pink-500 rounded-t h-[85%] relative group shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-white text-pink-600 text-[8px] font-bold px-1.5 py-0.5 rounded">
                    +40%
                </div>
            </div>
        </div>
    </div>
);

const UniAdaptVisual = () => (
    <div className="relative w-full h-full bg-[#0F1115] overflow-hidden flex items-center justify-center border-b border-white/5">
        <div className="relative w-32 h-20 bg-[#0A0A0B] rounded border border-gray-800 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-pink-500/5" />
            <div className="text-center">
                <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Module V1</div>
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ repeat: Infinity, repeatDelay: 2, duration: 0.5 }}
                    className="text-white text-xs font-bold flex items-center gap-1"
                >
                    <RefreshCw className="w-3 h-3 text-pink-500" />
                    Updated
                </motion.div>
            </div>
        </div>
    </div>
);


const STEPS = {
    student: [
        {
            step: 1,
            title: 'Sync',
            desc: 'Connect GitHub to auto-import projects.',
            icon: Github,
            visual: NanoCodeVisual,
            color: 'blue'
        },
        {
            step: 2,
            title: 'Analyze',
            desc: 'AI Scans code for missing skills.',
            icon: Search,
            visual: SimpleScanVisual,
            color: 'blue'
        },
        {
            step: 3,
            title: 'Grow',
            desc: 'Custom path to get hired fast.',
            icon: TrendingDown,
            visual: SimpleGrowVisual,
            color: 'blue'
        },
    ],
    recruiter: [
        {
            step: 1,
            title: 'Define',
            desc: 'Post jobs with AI skill-matching.',
            icon: Briefcase,
            visual: RecruiterPostVisual,
            color: 'purple'
        },
        {
            step: 2,
            title: 'Filter',
            desc: 'Filter by Verified Skill Scores.',
            icon: FileSearch,
            visual: RecruiterMatchVisual,
            color: 'purple'
        },
        {
            step: 3,
            title: 'Hire',
            desc: 'Direct offers to pre-vetted talent.',
            icon: UserCheck,
            visual: RecruiterHireVisual,
            color: 'purple'
        },
    ],
    university: [
        {
            step: 1,
            title: 'Integrate',
            desc: 'Sync curriculum with market data.',
            icon: Server,
            visual: UniIntegrateVisual,
            color: 'pink'
        },
        {
            step: 2,
            title: 'Insights',
            desc: 'Real-time skill gap analysis.',
            icon: BarChart3,
            visual: UniLiveVisual,
            color: 'pink'
        },
        {
            step: 3,
            title: 'Adapt',
            desc: 'Instantly update course modules.',
            icon: RefreshCw,
            visual: UniAdaptVisual,
            color: 'pink'
        },
    ]
};

export function HowItWorks() {
    const [activeTab, setActiveTab] = useState<'student' | 'recruiter' | 'university'>('student');

    return (
        <section className="h-screen min-h-[700px] bg-[#0A0A0B] flex flex-col justify-center relative overflow-hidden" id="how-it-works">


            <div className="container mx-auto px-6 relative z-10">
                {/* Centered Header & Tabs */}
                <div className="flex flex-col items-center text-center mb-16 space-y-8">
                    <div className="max-w-2xl">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                            How It Works
                        </h2>
                        <p className="text-gray-400 text-lg">
                            Data-driven career acceleration. No fluff, just results.
                        </p>
                    </div>

                    {/* Tabs */}
                    <div className="p-1.5 bg-white/5 rounded-full border border-white/10 flex backdrop-blur-sm">
                        {(['student', 'recruiter', 'university'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "px-6 py-2.5 rounded-full text-sm font-bold transition-all capitalize",
                                    activeTab === tab
                                        ? "bg-white text-black shadow-lg scale-105"
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                <div className="max-w-6xl mx-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.2 }}
                            className="grid md:grid-cols-3 gap-6"
                        >
                            {STEPS[activeTab].map((item, index) => (
                                <div
                                    key={item.step}
                                    className="group relative h-[360px] bg-[#0F1115] border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-all hover:shadow-2xl"
                                >
                                    {/* Nano Visual Area (60%) */}
                                    <div className="h-[60%] relative group-hover:opacity-100 transition-opacity">
                                        <item.visual />

                                        {/* Tech Badge */}
                                        <div className="absolute top-4 left-4 px-2 py-0.5 rounded bg-black/50 border border-white/10 backdrop-blur text-[10px] font-mono text-gray-400">
                                            STEP_0{item.step}
                                        </div>
                                    </div>

                                    {/* Content Area (40%) */}
                                    <div className="h-[40%] p-6 flex flex-col justify-end bg-[#0A0A0B] relative border-t border-white/5 group-hover:bg-[#0C0E12] transition-colors">
                                        <div className="absolute -top-6 left-6 w-10 h-10 rounded-lg bg-[#0A0A0B] border border-white/10 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300 group-hover:border-white/20">
                                            <item.icon className="w-5 h-5" />
                                        </div>

                                        <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                                        <p className="text-gray-400 text-sm leading-relaxed">
                                            {item.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
}
