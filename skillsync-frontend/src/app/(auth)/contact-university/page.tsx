"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, User, Building2, GraduationCap, CheckCircle2, Lock } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";

import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { AuthInput } from "@/components/auth/AuthInput";
import { GlassButton } from "@/components/ui/GlassButton";

const universitySchema = z.object({
    fullName: z.string().min(2, "Required"),
    jobTitle: z.string().min(2, "Required"),
    university: z.string().min(2, "Required"),
    faculty: z.string().min(2, "Required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    message: z.string().optional(),
});

type UniversityData = z.infer<typeof universitySchema>;

export default function UniversityContactPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const { signUp } = useAuth();
    const router = useRouter();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<UniversityData>({
        resolver: zodResolver(universitySchema),
    });

    const onSubmit = async (data: UniversityData) => {
        setIsLoading(true);
        setApiError(null);
        try {
            await signUp({
                fullName: data.fullName,
                email: data.email,
                password: data.password,
                role: 'university',
                university: data.university,
                faculty: data.faculty,
                jobTitle: data.jobTitle,
                message: data.message,
                termsAccepted: true
            });
            setToast("Signed in successfully! Redirecting...");
            setTimeout(() => {
                router.push('/university/dashboard');
            }, 1000);
        } catch (error: unknown) {
            setApiError((error as { error?: string })?.error || "Registration failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
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

            <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-5"
            >
                {apiError && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium"
                            >
                                {apiError}
                            </motion.div>
                        )}
                        {toast && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium flex items-center gap-2"
                            >
                                <CheckCircle2 size={18} />
                                {toast}
                            </motion.div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <AuthInput label="Full Name" placeholder="Dr. Perera" icon={User} register={register("fullName")} error={errors.fullName} />
                            <AuthInput label="Academic Title" placeholder="Dean / HOD" icon={GraduationCap} register={register("jobTitle")} error={errors.jobTitle} />
                        </div>

                        <AuthInput label="University Name" placeholder="University of Colombo" icon={Building2} register={register("university")} error={errors.university} />
                        <AuthInput label="Faculty / Department" placeholder="School of Computing" icon={Building2} register={register("faculty")} error={errors.faculty} />

                        <AuthInput label="Official Email" type="email" placeholder="dean@ucsc.cmb.ac.lk" icon={Mail} register={register("email")} error={errors.email} />
                        <AuthInput label="Password" type="password" placeholder="••••••••" icon={Lock} register={register("password")} error={errors.password} />

                        <GlassButton type="submit" variant="primary" className="w-full py-4 text-base font-bold bg-pink-600 hover:bg-pink-500 border-none" disabled={isLoading}>
                            {isLoading ? "Signing Up..." : "Sign Up"}
                        </GlassButton>

                        <p className="text-center text-sm text-gray-500 mt-6">
                            Already a partner?{" "}
                            <Link href="/login" className="text-blue-600 hover:underline font-medium">
                                Sign In
                            </Link>
                        </p>
                    </motion.form>
        </AuthSplitLayout>
    );
}
