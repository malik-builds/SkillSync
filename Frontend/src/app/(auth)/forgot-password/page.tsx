"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { AuthInput } from "@/components/auth/AuthInput";
import { GlassButton } from "@/components/ui/GlassButton";
import { useAuth } from "@/lib/auth/AuthContext";

const forgotSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
    const { forgotPassword } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submittedEmail, setSubmittedEmail] = useState("");
    const [resendCooldown, setResendCooldown] = useState(0);

    const { register, handleSubmit, formState: { errors } } = useForm<ForgotFormData>({
        resolver: zodResolver(forgotSchema),
    });

    const onSubmit = async (data: ForgotFormData) => {
        setIsLoading(true);
        try {
            await forgotPassword(data.email);
            setSubmittedEmail(data.email);
            setIsSubmitted(true);
            setResendCooldown(60);

            // Start cooldown timer
            const interval = setInterval(() => {
                setResendCooldown((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch {
            // Security: show success even on errors to prevent email enumeration
            setSubmittedEmail(data.email);
            setIsSubmitted(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;
        setIsLoading(true);
        try {
            await forgotPassword(submittedEmail);
            setResendCooldown(60);
            const interval = setInterval(() => {
                setResendCooldown((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } finally {
            setIsLoading(false);
        }
    };

    const marketingContent = (
        <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-4">Don&apos;t worry!</h3>
                <p className="text-gray-300 leading-relaxed">
                    Forgetting your password happens to everyone. We&apos;ll send you a secure link to reset
                    it in just a few minutes.
                </p>
                <div className="mt-6 space-y-3">
                    {[
                        "Check your inbox and spam folder",
                        "Link expires in 1 hour",
                        "Contact support if you need help"
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

    return (
        <AuthSplitLayout marketingContent={marketingContent}>
            {!isSubmitted ? (
                <>
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
                        <p className="text-gray-500">
                            Enter your email and we&apos;ll send you a link to reset your password.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <AuthInput
                            label="Email Address"
                            type="email"
                            placeholder="name@example.com"
                            icon={Mail}
                            register={register("email")}
                            error={errors.email}
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
                                "Send Reset Link"
                            )}
                        </GlassButton>
                    </form>

                    <div className="text-center mt-8">
                        <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-2">
                            <ArrowLeft size={16} />
                            Back to Sign In
                        </Link>
                    </div>
                </>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-6"
                >
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <Mail className="w-8 h-8 text-green-600" />
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Link Sent</h2>
                        <p className="text-gray-500">
                            If an account exists with <strong className="text-gray-700">{submittedEmail}</strong>,
                            you&apos;ll receive a password reset link shortly.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <GlassButton
                            onClick={handleResend}
                            disabled={resendCooldown > 0 || isLoading}
                            className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 border-none font-medium"
                        >
                            {resendCooldown > 0
                                ? `Resend in ${resendCooldown}s`
                                : "Resend Reset Link"
                            }
                        </GlassButton>
                    </div>

                    <div className="pt-4">
                        <Link href="/login" className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline inline-flex items-center gap-2">
                            <ArrowLeft size={16} />
                            Back to Sign In
                        </Link>
                    </div>
                </motion.div>
            )}
        </AuthSplitLayout>
    );
}
