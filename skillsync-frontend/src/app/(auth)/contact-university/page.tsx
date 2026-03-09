"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, User, Building2, GraduationCap, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { AuthInput } from "@/components/auth/AuthInput";
import { GlassButton } from "@/components/ui/GlassButton";

const universitySchema = z.object({
    fullName: z.string().min(2, "Required"),
    jobTitle: z.string().min(2, "Required"),
    university: z.string().min(2, "Required"),
    faculty: z.string().min(2, "Required"),
    email: z.string().email("Invalid email").refine(email => email.endsWith(".ac.lk") || email.endsWith(".edu"), {
        message: "Please use an official academic email (.ac.lk or .edu)",
    }),
    message: z.string().min(10, "Please provide more details"),
});

type UniversityData = z.infer<typeof universitySchema>;

export default function UniversityContactPage() {
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<UniversityData>({
        resolver: zodResolver(universitySchema),
    });

    const onSubmit = async (data: UniversityData) => {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setIsSuccess(true);
        setIsLoading(false);
    };

    const marketingContent = (
        <div className="space-y-8">
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400">
                        <Building2 size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Enterprise Access</h3>
                        <p className="text-sm text-gray-400">For Academic Institutions</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <p className="text-gray-300">
                        SkillSync isn&apos;t just a job board. It&apos;s a <strong className="text-white">curriculum intelligence platform</strong>.
                    </p>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                            <CheckCircle2 className="text-pink-500 mt-1" size={18} />
                            <span className="text-sm text-gray-400">View real-time skill gaps in your student body.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <CheckCircle2 className="text-pink-500 mt-1" size={18} />
                            <span className="text-sm text-gray-400">Align curriculum with actual industry demand.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <CheckCircle2 className="text-pink-500 mt-1" size={18} />
                            <span className="text-sm text-gray-400">Boost graduate employability rates.</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );

    return (
        <AuthSplitLayout marketingContent={marketingContent}>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Partner with SkillSync</h1>
                <p className="text-gray-600">
                    Request institutional access for your university.
                </p>
            </div>

            <AnimatePresence mode="wait">
                {!isSuccess ? (
                    <motion.form
                        key="form"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-5"
                    >
                        <div className="grid grid-cols-2 gap-4">
                            <AuthInput label="Full Name" placeholder="Dr. Perera" icon={User} register={register("fullName")} error={errors.fullName} />
                            <AuthInput label="Academic Title" placeholder="Dean / HOD" icon={GraduationCap} register={register("jobTitle")} error={errors.jobTitle} />
                        </div>

                        <AuthInput label="University Name" placeholder="University of Colombo" icon={Building2} register={register("university")} error={errors.university} />
                        <AuthInput label="Faculty / Department" placeholder="School of Computing" icon={Building2} register={register("faculty")} error={errors.faculty} />

                        <AuthInput label="Official Email" type="email" placeholder="dean@ucsc.cmb.ac.lk" icon={Mail} register={register("email")} error={errors.email} />

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">How can we help?</label>
                            <textarea
                                {...register("message")}
                                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3.5 text-gray-900 placeholder-gray-400 outline-none focus:border-pink-500 focus:bg-white focus:ring-4 focus:ring-pink-500/10 h-32 resize-none"
                                placeholder="Tell us about your current placement challenges..."
                            />
                            {errors.message && <p className="text-sm text-red-400">{errors.message.message}</p>}
                        </div>

                        <GlassButton type="submit" variant="primary" className="w-full py-4 text-base font-bold bg-pink-600 hover:bg-pink-500 border-none" disabled={isLoading}>
                            {isLoading ? "Submiting..." : "Request Platform Access"}
                        </GlassButton>

                        <p className="text-center text-sm text-gray-500 mt-6">
                            Already a partner?{" "}
                            <Link href="/login" className="text-blue-600 hover:underline font-medium">
                                Sign In
                            </Link>
                        </p>
                    </motion.form>
                ) : (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-12"
                    >
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 size={40} className="text-green-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Received</h2>
                        <p className="text-gray-600 mb-8">
                            Thank you for your interest. Our partnership team will review your details and contact you at <strong className="text-gray-900">official email</strong> within 24 hours.
                        </p>
                        <Link href="/">
                            <GlassButton variant="secondary" className="px-8">
                                Return to Home
                            </GlassButton>
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>
        </AuthSplitLayout>
    );
}
