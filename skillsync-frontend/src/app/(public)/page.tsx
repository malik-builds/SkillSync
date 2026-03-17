"use client";

import { useState } from "react";
import { Hero } from "@/components/marketing/Hero";
import { Features } from "@/components/marketing/Features";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Pricing } from "@/components/marketing/Pricing";
import { GlassButton } from "@/components/ui/GlassButton";
import { motion, AnimatePresence } from "framer-motion";
import {
    GraduationCap,
    Briefcase,
    AlertTriangle,
    FileSearch,
    TrendingDown,
    Plus,
    Minus,
    Building2,
} from "lucide-react";
import Link from "next/link";

const TRUSTED_LOGOS = [
    "University of Colombo", "SLIIT", "IIT", "Tech Innovations Ltd", "Virtusa", "Pearson",
    "University of Colombo", "SLIIT", "IIT", "Tech Innovations Ltd", "Virtusa", "Pearson",
    "University of Colombo", "SLIIT", "IIT", "Tech Innovations Ltd", "Virtusa", "Pearson"
];

const FAQS = [
    { q: "Is SkillSync free for students?", a: "Yes! Core features like skill analysis, GitHub scanning, and job matching are 100% free for students." },
    { q: "How does the verification work?", a: "We scan your public GitHub repositories for code complexity, language usage, and best practices to verify your skills." },
    { q: "Do you share my data?", a: "Your personal data is private. We only share anonymized aggregate data with universities for curriculum improvement." },
];

export default function LandingPage() {
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

    return (
        <div className="relative overflow-x-hidden bg-white">
            <div className="relative z-10">
                <Hero />

                {/* Trust Strip - Off-white background, Black text */}
                <section className="py-10 border-y border-gray-100 bg-[#F8F7F4] overflow-hidden">
                    <div className="container mx-auto px-6 mb-4 text-center">
                        <p className="text-sm text-black font-bold uppercase tracking-widest">Trusted by leading institutions</p>
                    </div>
                    <div className="relative flex overflow-x-hidden group">
                        <motion.div
                            className="flex gap-16 items-center whitespace-nowrap px-4"
                            animate={{ x: ["0%", "-50%"] }}
                            transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
                        >
                            {TRUSTED_LOGOS.map((logo, i) => (
                                <span key={i} className="text-xl md:text-2xl font-bold text-black opacity-80 hover:opacity-100 transition-opacity cursor-default">
                                    {logo}
                                </span>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* Problem Section - White background */}
                <section className="py-16 relative bg-white">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-gray-900">The <span className="text-red-600">Broken</span> Bridge</h2>
                            <p className="text-gray-600 max-w-2xl mx-auto">Why fits are failing despite degrees and job openings.</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                viewport={{ once: true }}
                                className="group p-6 rounded-2xl hover:border-red-500/30 transition-colors bg-[#F8F7F4] border border-gray-100 shadow-none">
                                <div className="p-3 bg-red-100 rounded-xl inline-block mb-4 text-red-600 group-hover:scale-110 transition-transform">
                                    <AlertTriangle className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold mb-2 text-gray-900">The Student Trap</h3>
                                <p className="text-gray-600">Graduating with good grades but still getting rejected? It&apos;s not you; it&apos;s the <strong className="text-gray-900">Skill Gap</strong> between curriculum and industry.</p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                viewport={{ once: true }}
                                className="group p-6 rounded-2xl hover:border-orange-500/30 transition-colors bg-[#F8F7F4] border border-gray-100 shadow-none">
                                <div className="p-3 bg-orange-100 rounded-xl inline-block mb-4 text-orange-600 group-hover:scale-110 transition-transform">
                                    <FileSearch className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold mb-2 text-gray-900">The Recruiter Fatigue</h3>
                                <p className="text-gray-600">Tired of shifting through hundreds of CVs that list &apos;Java&apos; but have <strong className="text-gray-900">no code</strong> to back it up?</p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                viewport={{ once: true }}
                                className="group p-6 rounded-2xl hover:border-yellow-500/30 transition-colors bg-[#F8F7F4] border border-gray-100 shadow-none">
                                <div className="p-3 bg-yellow-100 rounded-xl inline-block mb-4 text-yellow-600 group-hover:scale-110 transition-transform">
                                    <TrendingDown className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold mb-2 text-gray-900">The University Blindspot</h3>
                                <p className="text-gray-600">Struggling to track if your syllabus matches what companies are hiring for <strong className="text-gray-900">right now</strong>?</p>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Solution Section (Triangle) - Off-white background */}
                <section className="py-12 relative overflow-hidden bg-[#F8F7F4]">
                    <div className="container mx-auto px-6">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            viewport={{ once: true }}
                            className="p-8 md:p-12 relative overflow-hidden bg-white shadow-xl border border-gray-100 rounded-[3rem]">
                            <div className="grid md:grid-cols-2 gap-12 items-center">
                                <div className="text-left">
                                    <h2 className="text-3xl md:text-5xl font-bold mb-6 text-gray-900 leading-tight">
                                        Meet SkillSync <br />
                                        The <span className="text-blue-600">AI-Bridge</span>
                                    </h2>
                                    <p className="text-gray-600 text-lg leading-relaxed mb-8">
                                        We don&apos;t just list jobs. We analyze code, verify skills, and match candidates based on <strong className="text-gray-900">real data</strong>, not just claims on a CV.
                                    </p>
                                    <GlassButton
                                        variant="primary"
                                        className="px-8 py-3 bg-blue-600 text-white hover:bg-blue-700 font-bold border-none shadow-lg"
                                        onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                                    >
                                        See How It Works
                                    </GlassButton>
                                </div>

                                <div className="relative w-full max-w-md mx-auto aspect-square flex items-center justify-center">
                                    {/* Triangle Animation Lines */}
                                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                                        <path d="M50 15 L20 85 L80 85 Z" stroke="url(#gradient)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" fill="none" className="opacity-30" />
                                        <defs>
                                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#3b82f6" />
                                                <stop offset="100%" stopColor="#8b5cf6" />
                                            </linearGradient>
                                        </defs>
                                        {/* Animated Dots */}
                                        <motion.circle r="1" fill="#3b82f6"
                                            animate={{ pathLength: 1, offsetDistance: ["0%", "100%"] }}
                                            style={{ offsetPath: "path('M50 15 L20 85 L80 85 Z')" }}
                                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                        />
                                    </svg>

                                    <div className="absolute top-0 md:top-8 left-1/2 -translate-x-1/2">
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                                            className="p-4 flex flex-col items-center bg-white z-10 w-40 border border-gray-100 shadow-lg rounded-2xl">
                                            <GraduationCap className="w-8 h-8 text-blue-500 mb-2" />
                                            <span className="font-bold text-sm text-gray-900">Student Data</span>
                                        </motion.div>
                                    </div>
                                    <div className="absolute bottom-0 md:bottom-8 left-0">
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                                            className="p-4 flex flex-col items-center bg-white z-10 w-40 border border-gray-100 shadow-lg rounded-2xl">
                                            <Building2 className="w-8 h-8 text-purple-500 mb-2" />
                                            <span className="font-bold text-sm text-gray-900">University</span>
                                        </motion.div>
                                    </div>
                                    <div className="absolute bottom-0 md:bottom-8 right-0">
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                                            className="p-4 flex flex-col items-center bg-white z-10 w-40 border border-gray-100 shadow-lg rounded-2xl">
                                            <Briefcase className="w-8 h-8 text-pink-500 mb-2" />
                                            <span className="font-bold text-sm text-gray-900">Tech Industry</span>
                                        </motion.div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                <HowItWorks />

                <Features />
                <Pricing />

                {/* Testimonials & FAQ - Off-white background */}
                <section className="py-24 relative bg-[#F8F7F4]">
                    <div className="container mx-auto px-6">
                        <div className="grid md:grid-cols-2 gap-16">
                            <div>
                                <h3 className="text-2xl font-bold mb-8 text-gray-900">What People Say</h3>
                                <div className="space-y-6">
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }}
                                        className="bg-white border-l-4 border-blue-500 p-6 shadow-md rounded-2xl">
                                        <p className="italic text-gray-600 mb-4">&quot;I didn&apos;t know I needed Docker until SkillSync told me. Learned it in 2 weeks and got hired.&quot;</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white">BP</div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">Bawantha P.</p>
                                                <p className="text-xs text-gray-500">Software Engineer @ Virtusa</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }} viewport={{ once: true }}
                                        className="bg-white border-l-4 border-purple-500 p-6 shadow-md rounded-2xl">
                                        <p className="italic text-gray-600 mb-4">&quot;The &apos;Verified Skills&apos; badge saves us technical interview time. We hire faster now.&quot;</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center font-bold text-white">JD</div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">John Doe</p>
                                                <p className="text-xs text-gray-500">HR Manager @ TechCorp</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-2xl font-bold mb-8 text-gray-900">Frequently Asked Questions</h3>
                                <div className="space-y-4">
                                    {FAQS.map((faq, i) => (
                                        <div key={i} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                            <button
                                                onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                                                className="w-full flex items-center justify-between p-4 text-left font-medium hover:bg-gray-50 transition-colors text-gray-900"
                                            >
                                                {faq.q}
                                                {openFaqIndex === i ? <Minus className="w-4 h-4 text-blue-500" /> : <Plus className="w-4 h-4 text-gray-400" />}
                                            </button>
                                            <AnimatePresence>
                                                {openFaqIndex === i && (
                                                    <motion.div
                                                        initial={{ height: 0 }}
                                                        animate={{ height: 'auto' }}
                                                        exit={{ height: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="p-4 pt-0 text-sm text-gray-600 leading-relaxed">
                                                            {faq.a}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Final CTA - White background */}
                <section className="py-24 relative overflow-hidden bg-white">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 opacity-50" />
                    <div className="container mx-auto px-6 relative z-10 text-center">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">Your Career Can&apos;t Wait.</h2>
                        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">Join 1000+ students bridging the gap today.</p>
                        <Link href="/register">
                            <GlassButton
                                variant="primary"
                                size="lg"
                                className="mt-6 px-10 py-6 text-xl shadow-xl bg-blue-600 text-white hover:bg-blue-700 font-bold border-none"
                            >
                                Get Started Now
                            </GlassButton>
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
