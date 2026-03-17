"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Mail, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthCheckbox } from "@/components/auth/AuthCheckbox";
import { RoleTabs, UserRole } from "@/components/auth/RoleTabs";
import { SocialLogin } from "@/components/auth/SocialLogin";
import { GlassButton } from "@/components/ui/GlassButton";
import { useAuth } from "@/lib/auth/AuthContext";
import { needsOnboarding, getAuthRedirect } from "@/lib/auth/auth-helpers";

const loginSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(1, "Password is required"),
    rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const [activeRole, setActiveRole] = useState<UserRole>("student");
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const router = useRouter();
    const { signIn } = useAuth();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: { rememberMe: false },
    });

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        setApiError(null);

        try {
            const response = await signIn({
                email: data.email,
                password: data.password,
                rememberMe: data.rememberMe ?? false,
            });

            // Redirect based on onboarding status
            const user = response.user;
            if (needsOnboarding(user)) {
                router.push("/onboarding");
            } else {
                router.push(getAuthRedirect(user));
            }
        } catch (error: unknown) {
            // Handle API error objects or standard Error instances
            let message = "Invalid email or password. Please try again.";
            if (error instanceof Error) {
                message = error.message;
            } else if (typeof error === 'object' && error !== null && 'error' in error) {
                message = (error as { error: string }).error;
            }

            setApiError(message);
        } finally {
            setIsLoading(false);
        }
    };

    // Dynamic Marketing Content for Left Panel
    const marketingContent = (
        <div key={activeRole} className="space-y-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative"
            >
                {activeRole === "student" && (
                    <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                <CheckCircle2 size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Skill Verified</h3>
                                <p className="text-sm text-gray-400">React.js Expert</p>
                            </div>
                        </div>
                        <p className="text-lg text-gray-300 italic mb-4">
                            &quot;I skipped 3 rounds of technical interviews because my SkillSync profile proved I could actually code.&quot;
                        </p>
                        <p className="font-bold text-white">— Sarah J., Hired at Virtusa</p>
                    </div>
                )}

                {activeRole === "recruiter" && (
                    <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                                <CheckCircle2 size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Time Saved</h3>
                                <p className="text-sm text-gray-400">Hiring Metric</p>
                            </div>
                        </div>
                        <p className="text-lg text-gray-300 italic mb-4">
                            &quot;We stopped filtering CVs manually. The AI matches are 90% accurate to our job descriptions.&quot;
                        </p>
                        <p className="font-bold text-white">— James L., Tech Lead @ Sysco</p>
                    </div>
                )}

                {activeRole === "university" && (
                    <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400">
                                <CheckCircle2 size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Curriculum Gap</h3>
                                <p className="text-sm text-gray-400">Real-time Insight</p>
                            </div>
                        </div>
                        <p className="text-lg text-gray-300 italic mb-4">
                            &quot;SkillSync showed us exactly where our syllabus was lagging behind industry trends. We updated it in weeks.&quot;
                        </p>
                        <p className="font-bold text-white">— Dr. Perera, Dean of Computing</p>
                    </div>
                )}
            </motion.div>
        </div>
    );

    return (
        <AuthSplitLayout marketingContent={marketingContent}>
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
                <p className="text-gray-500">
                    Sign in to access your {activeRole} dashboard.
                </p>
            </div>

            <RoleTabs activeRole={activeRole} onRoleChange={(role) => setActiveRole(role)} />

            {/* API Error Banner */}
            {apiError && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl"
                >
                    <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
                    <div className="text-sm text-red-700">
                        <p>{apiError}</p>
                    </div>
                </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <AuthInput
                    label="Email Address"
                    type="email"
                    placeholder="name@example.com"
                    icon={Mail}
                    register={register("email")}
                    error={errors.email}
                    className="text-gray-900"
                    labelClassName="text-gray-700 font-medium"
                    inputClassName="h-11 py-2.5 bg-gray-50 !border-2 !border-gray-300 !text-gray-900 shadow-sm focus:bg-white focus:!border-blue-500 placeholder:text-gray-400"
                />

                <div className="space-y-1">
                    <AuthInput
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        icon={Lock}
                        register={register("password")}
                        error={errors.password}
                        className="text-gray-900"
                        labelClassName="text-gray-700 font-medium"
                        inputClassName="h-11 py-2.5 bg-gray-50 !border-2 !border-gray-300 !text-gray-900 shadow-sm focus:bg-white focus:!border-blue-500 placeholder:text-gray-400"
                    />
                    <div className="flex items-center justify-between">
                        <AuthCheckbox
                            label="Remember me"
                            register={register("rememberMe")}
                        />
                        <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500 transition-colors font-medium">
                            Forgot password?
                        </Link>
                    </div>
                </div>

                <GlassButton
                    type="submit"
                    variant="primary"
                    className="w-full py-4 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 border-none"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                    ) : (
                        "Sign In"
                    )}
                </GlassButton>
            </form>

            {activeRole === "student" && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-6"
                >
                    <SocialLogin />
                </motion.div>
            )}

            <div className="text-center text-sm text-gray-500 mt-8">
                Don&apos;t have an account?{" "}
                <Link href={activeRole === "university" ? "/contact-university" : `/register/${activeRole}`} className="text-blue-600 hover:text-blue-700 hover:underline font-bold">
                    {activeRole === "university" ? "Request Access" : "Sign up"}
                </Link>
            </div>
        </AuthSplitLayout>
    );
}
