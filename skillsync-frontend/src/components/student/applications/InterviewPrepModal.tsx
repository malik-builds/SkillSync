"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { X, CheckCircle2, MessageCircle, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface InterviewPrepModalProps {
    isOpen: boolean;
    onClose: () => void;
    jobTitle: string;
    company: string;
}

export function InterviewPrepModal({ isOpen, onClose, jobTitle, company }: InterviewPrepModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-4xl max-h-[90vh] bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
                        >
                            {/* Left: Job Context */}
                            <div className="md:w-1/2 p-6 border-b md:border-b-0 md:border-r border-gray-200 overflow-y-auto">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Job Context</h3>
                                <p className="text-gray-500 text-sm mb-6">{jobTitle} at {company}</p>

                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-sm font-bold text-blue-600 uppercase mb-2">Key Requirements</h4>
                                        <ul className="space-y-2">
                                            <li className="flex items-start gap-2 text-sm text-gray-600">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                                                Experience with React.js and modern frontend workflows.
                                            </li>
                                            <li className="flex items-start gap-2 text-sm text-gray-600">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                                                Knowledge of restful APIs and state management (Redux/Zustand).
                                            </li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-bold text-purple-600 uppercase mb-2">Company Culture</h4>
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            &quot;We value innovation, ownership, and a growth mindset. We look for engineers who are not afraid to challenge the status quo.&quot;
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Cheat Sheet */}
                            <div className="md:w-1/2 p-6 bg-gray-50 overflow-y-auto">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <FileText size={20} className="text-green-600" /> Your Cheat Sheet
                                    </h3>
                                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 text-gray-400 transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <GlassCard className="p-4 border-green-200 bg-green-50 shadow-sm">
                                        <h4 className="text-sm font-bold text-green-700 mb-2 flex items-center gap-2">
                                            <CheckCircle2 size={14} /> Talking Points (Strengths)
                                        </h4>
                                        <ul className="space-y-2">
                                            <li className="text-sm text-gray-700">• Highlight your <span className="text-gray-900 font-bold">E-commerce Project</span> (React/Node).</li>
                                            <li className="text-sm text-gray-700">• Mention your <span className="text-gray-900 font-bold">Verified React Skill</span> badge.</li>
                                        </ul>
                                    </GlassCard>

                                    <GlassCard className="p-4 border-blue-200 bg-blue-50 shadow-sm">
                                        <h4 className="text-sm font-bold text-blue-700 mb-2 flex items-center gap-2">
                                            <MessageCircle size={14} /> Questions to Ask
                                        </h4>
                                        <ul className="space-y-2">
                                            <li className="text-sm text-gray-700">• &quot;How does the engineering team handle technical debt?&quot;</li>
                                            <li className="text-sm text-gray-700">• &quot;What does the typical career path look like for this role?&quot;</li>
                                        </ul>
                                    </GlassCard>
                                </div>

                                <button className="w-full mt-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 transition-all">
                                    Got it, I&apos;m Ready!
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
