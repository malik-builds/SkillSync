"use client";

import { GlassButton } from "@/components/ui/GlassButton";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { HeroVideo } from "./HeroVideo";
import { useModal } from "@/lib/context/ModalContext";

export function Hero() {
    const { openDemoModal } = useModal();

    // Skill Score Animation
    const [score, setScore] = useState(60);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: false });

    useEffect(() => {
        if (isInView) {
            const interval = setInterval(() => {
                setScore(prev => {
                    if (prev >= 92) {
                        clearInterval(interval);
                        return 92;
                    }
                    return prev + 1;
                });
            }, 50);
            return () => clearInterval(interval);
        } else {
            setScore(60);
        }
    }, [isInView]);

    return (
        <>
            <section className="relative min-h-screen flex items-center pt-20 pb-20 overflow-hidden">
                {/* Full Background Video */}
                <HeroVideo />

                <div className="container mx-auto px-6 relative z-20">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                        {/* Left Column: Text & CTA - Now overlaying video with better contrast */}
                        <div className="flex flex-col text-left lg:pr-10">
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                            >
                                <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] mb-8 tracking-tight text-white">
                                    Bridge Your <br />
                                    <span className="text-blue-500">Skill Gaps</span>, <br />
                                    Land Your Dream Job.
                                </h1>

                                <p className="text-xl text-gray-300 mb-10 max-w-xl leading-relaxed font-medium">
                                    The AI-powered ecosystem connecting Students, Recruiters, and Universities. Verify skills, analyze gaps, and hire with confidence.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-5">
                                    <Link href="/register">
                                        <GlassButton
                                            className="h-14 px-8 text-lg bg-blue-600 hover:bg-blue-500 text-white shadow-xl hover:shadow-2xl hover:shadow-blue-500/20 border-none transition-all duration-300"
                                        >
                                            Get Started
                                            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </GlassButton>
                                    </Link>

                                    <GlassButton
                                        onClick={openDemoModal}
                                        className="h-14 px-8 text-lg bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white shadow-sm hover:shadow-md transition-all"
                                    >
                                        <Play className="mr-2 w-5 h-5 fill-current opacity-70" />
                                        Book a Free Demo
                                    </GlassButton>
                                </div>
                            </motion.div>
                        </div>

                        {/* Right side is now empty/transparent to show the video clearly */}
                        <div className="hidden lg:block"></div>

                    </div>
                </div>
            </section>
        </>
    );
}
