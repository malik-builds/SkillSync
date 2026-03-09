"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

interface AuthSplitLayoutProps {
    children: ReactNode;
    marketingContent: ReactNode;
    backgroundImage?: string;
}

export function AuthSplitLayout({ children, marketingContent, backgroundImage }: AuthSplitLayoutProps) {
    return (
        <div className="flex min-h-screen w-full bg-white text-gray-900 overflow-hidden">
            {/* Left Side - Marketing Panel (Hidden on Mobile) */}
            <div className="hidden lg:flex w-1/2 relative flex-col justify-center items-center p-12 overflow-hidden bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 border-r border-white/10">
                {/* Global Mesh Background for Left Panel */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] bg-white/10 rounded-full blur-[150px]" />
                    <div className="absolute bottom-[-20%] right-[-20%] w-[800px] h-[800px] bg-purple-500/20 rounded-full blur-[150px]" />
                </div>

                {/* Brand Logo - Separate from content */}
                <div className="absolute top-8 left-8 z-20">
                    <Link href="/" className="flex items-center gap-2 font-bold text-2xl tracking-tighter hover:opacity-80 transition-opacity text-white">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white">
                            S
                        </div>
                        SkillSync.
                    </Link>
                </div>

                {/* Dynamic Content */}
                <div className="relative z-10 w-full max-w-lg">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        {marketingContent}
                    </motion.div>
                </div>
            </div>

            {/* Right Side - Form Container */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 relative bg-white">
                {/* Mobile Back Button */}
                <div className="absolute top-8 left-8 lg:hidden">
                    <Link href="/" className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                </div>

                <div className="w-full max-w-md space-y-8 relative z-10">
                    {children}
                </div>
            </div>
        </div>
    );
}
