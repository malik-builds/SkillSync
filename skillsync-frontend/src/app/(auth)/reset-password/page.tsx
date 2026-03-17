"use client";

import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Lock, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { AuthInput } from "@/components/auth/AuthInput";
import { GlassButton } from "@/components/ui/GlassButton";
import { useAuth } from "@/lib/auth/AuthContext";
import { checkPasswordStrength } from "@/lib/auth/auth-helpers";

const resetSchema = z.object({
    newPassword: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Must contain an uppercase letter")
        .regex(/[0-9]/, "Must contain a number"),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

type ResetFormData = z.infer<typeof resetSchema>;

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { resetPassword } = useAuth();

    const token = searchParams.get("token") || "";

    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isTokenInvalid, setIsTokenInvalid] = useState(!token);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [redirectCountdown, setRedirectCountdown] = useState(5);

    const { register, handleSubmit, formState: { errors }, watch } = useForm<ResetFormData>({
        resolver: zodResolver(resetSchema),
    });

    const newPassword = watch("newPassword");

    useEffect(() => {
        if (!newPassword) {
            setPasswordStrength(0);
            return;
        }
        const { score } = checkPasswordStrength(newPassword);
        setPasswordStrength(score);
    }, [newPassword]);

    // Auto-redirect countdown after success
    useEffect(() => {
        if (!isSuccess) return;
        if (redirectCountdown <= 0) {
            router.push("/login");
            return;
        }
        const timer = setTimeout(() => setRedirectCountdown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [isSuccess, redirectCountdown, router]);

    const onSubmit = async (data: ResetFormData) => {
        setIsLoading(true);
        try {
            await resetPassword(token, data.newPassword);
            setIsSuccess(true);
        } catch {
            setIsTokenInvalid(true);
        } finally {
            setIsLoading(false);
        }
    };

    const marketingContent = (
        <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-4">Choose a Strong Password</h3>
                <div className="space-y-3">
                    {[
                        "At least 8 characters long",
                        "Include an uppercase letter",
                        "Include a number",
                        "Special characters recommended"
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <CheckCircle2 size={16} className="text-blue-400 shrink-0" />
                            <span className="text-sm text-gray-400">{item}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    if (isTokenInvalid && !isSuccess) {
        return (
            <AuthSplitLayout marketingContent={marketingContent}>
                <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Reset Link</h2>
                        <p className="text-gray-500">This link is invalid or has expired.</p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/login" className="flex-1">
                            <GlassButton className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 border-none font-medium">
                                Go to Login
                            </GlassButton>
                        </Link>
                        <Link href="/forgot-password" className="flex-1">
                            <GlassButton variant="primary" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white border-none font-bold">
                                Request New Link
                            </GlassButton>
                        </Link>
                    </div>
                </div>
            </AuthSplitLayout>
        );
    }

    return (
        <AuthSplitLayout marketingContent={marketingContent}>
            {!isSuccess ? (
                <>
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Your Password</h1>
                        <p className="text-gray-500">Choose a strong password for your account.</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-1">
                            <AuthInput
                                label="New Password"
                                type="password"
                                placeholder="••••••••"
                                icon={Lock}
                                register={register("newPassword")}
                                error={errors.newPassword}
                                inputClassName="h-11 py-2.5 bg-gray-50 !border-2 !border-gray-300 !text-gray-900 shadow-sm focus:bg-white focus:!border-blue-500 placeholder:text-gray-400"
                                labelClassName="text-gray-700 font-medium"
                            />
                            {newPassword && (
                                <div className="flex gap-1 h-1.5 mt-1">
                                    {[...Array(4)].map((_, i) => (
                                        <div
                                            key={i}
                                            className={`flex-1 rounded-full transition-colors duration-300 ${i < passwordStrength
                                                ? passwordStrength <= 1 ? "bg-red-500" : passwordStrength === 2 ? "bg-orange-500" : passwordStrength === 3 ? "bg-yellow-500" : "bg-green-500"
                                                : "bg-gray-200"
                                                }`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        <AuthInput
                            label="Confirm New Password"
                            type="password"
                            placeholder="••••••••"
                            icon={Lock}
                            register={register("confirmPassword")}
                            error={errors.confirmPassword}
                            inputClassName="h-11 py-2.5 bg-gray-50 !border-2 !border-gray-300 !text-gray-900 shadow-sm focus:bg-white focus:!border-blue-500 placeholder:text-gray-400"
                            labelClassName="text-gray-700 font-medium"
                        />

                        <GlassButton
                            type="submit"
                            variant="primary"
                            className="w-full py-4 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 border-none"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                            ) : (
                                "Reset Password"
                            )}
                        </GlassButton>
                    </form>
                </>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-6 py-8"
                >
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset Successfully!</h2>
                        <p className="text-gray-500">Your password has been updated.</p>
                    </div>
                    <Link href="/login">
                        <GlassButton
                            variant="primary"
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white border-none font-bold inline-flex items-center justify-center gap-2"
                        >
                            Go to Sign In <ArrowRight size={18} />
                        </GlassButton>
                    </Link>
                    <p className="text-sm text-gray-400">Redirecting in {redirectCountdown}s...</p>
                </motion.div>
            )}
        </AuthSplitLayout>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
