"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { GlassButton } from "@/components/ui/GlassButton";
import { AuthInput } from "@/components/auth/AuthInput";
import { Mail, Lock, User, GraduationCap, Building2, Loader2, CheckCircle2, ArrowLeft, Calendar } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthCheckbox } from "@/components/auth/AuthCheckbox";
import { useAuth } from "@/lib/auth/AuthContext";
import { checkPasswordStrength } from "@/lib/auth/auth-helpers";

// --- Validation Schema ---
const studentSchema = z.object({
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Last name is required"),
    email: z.string().email("Invalid email address"),
    university: z.string().min(1, "Please select your university"),
    programme: z.string().min(1, "Please select your programme"),
    graduationYear: z.string().min(1, "Please select graduation year"),
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Must contain an uppercase letter")
        .regex(/[0-9]/, "Must contain a number"),
    confirmPassword: z.string(),
    agreeTerm: z.boolean().refine((val) => val === true, "You must agree to the terms"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

type StudentFormValues = z.infer<typeof studentSchema>;

// --- Reference Data ---
const UNIVERSITIES = [
    { value: "University of Colombo", label: "University of Colombo" },
    { value: "SLIIT", label: "SLIIT" },
    { value: "IIT", label: "IIT (Informatics Institute of Technology)" },
    { value: "University of Moratuwa", label: "University of Moratuwa" },
    { value: "NSBM Green University", label: "NSBM Green University" },
];

const PROGRAMMES = [
    { value: "Computer Science", label: "BSc Computer Science" },
    { value: "Software Engineering", label: "BSc Software Engineering" },
    { value: "Information Technology", label: "BSc Information Technology" },
    { value: "Data Science", label: "BSc Data Science" },
    { value: "Cyber Security", label: "BSc Cyber Security" },
];

const GRADUATION_YEARS = [
    { value: "2025", label: "2025" },
    { value: "2026", label: "2026" },
    { value: "2027", label: "2027" },
    { value: "2028", label: "2028" },
    { value: "2029", label: "2029" },
];

export default function StudentRegisterPage() {
    const router = useRouter();
    const { signUp } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [apiError, setApiError] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors }, watch } = useForm<StudentFormValues>({
        resolver: zodResolver(studentSchema),
    });

    const password = watch("password");

    // Password Strength Calculation
    useEffect(() => {
        if (!password) {
            setPasswordStrength(0);
            return;
        }
        const { score } = checkPasswordStrength(password);
        setPasswordStrength(score);
    }, [password]);

    const onSubmit = async (data: StudentFormValues) => {
        setIsLoading(true);
        setApiError(null);

        try {
            const result = await signUp({
                fullName: `${data.firstName} ${data.lastName}`,
                email: data.email,
                password: data.password,
                role: 'student',
                university: data.university,
                programme: data.programme,
                graduationYear: parseInt(data.graduationYear),
                termsAccepted: data.agreeTerm,
            });

            // Redirect straight to onboarding
            router.push('/onboarding');
        } catch (error: unknown) {
            setApiError((error as { error?: string })?.error || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen w-full bg-[#F3F4F6] flex items-center justify-center p-2 md:p-4 overflow-hidden">
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full max-w-7xl h-full max-h-[900px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-gray-300"
            >
                {/* LEFT SIDE - Visual & Context */}
                <div className="hidden lg:flex lg:w-[35%] bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 p-10 text-white flex-col justify-between relative overflow-hidden border-r border-white/10">
                    {/* Background Patterns */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                    {/* Logo/Header */}
                    <div className="relative z-10">
                        <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tighter hover:opacity-90 transition-opacity w-fit text-white">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white">
                                <GraduationCap size={18} />
                            </div>
                            SkillSync.
                        </Link>

                        <div className="mt-12 space-y-4">
                            <h1 className="text-3xl xl:text-4xl font-bold leading-tight text-white">
                                Launch Your <br />
                                <span className="text-blue-400">Tech Career.</span>
                            </h1>
                            <p className="text-gray-400 text-sm xl:text-base max-w-sm leading-relaxed">
                                Join thousands of students getting hired based on Verified Skills, not just keywords.
                            </p>
                        </div>
                    </div>

                    {/* Features List */}
                    <div className="relative z-10 mt-8 space-y-3">
                        {[
                            "AI-Powered Skill Analysis",
                            "Direct Matches with Top Tech Firms",
                            "Automated CV Scanning",
                            "Project Portfolio Verification"
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                                    <CheckCircle2 size={12} className="text-blue-400" />
                                </div>
                                <span className="font-medium text-sm text-gray-300">{item}</span>
                            </div>
                        ))}
                    </div>

                    {/* Bottom Link */}
                    <div className="relative z-10 mt-8 pt-6 border-t border-white/10">
                        <p className="text-xs text-gray-500">
                            Trusted by 50+ Universities worldwide.
                        </p>
                    </div>
                </div>

                {/* RIGHT SIDE - Registration Form */}
                <div className="w-full lg:w-[65%] h-full p-6 md:p-10 bg-white flex flex-col justify-center overflow-y-auto custom-scrollbar">
                    <div className="max-w-2xl mx-auto w-full">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Sign Up</h2>
                                <p className="text-sm text-gray-500">Create your student profile</p>
                            </div>
                            <div className="text-sm">
                                <span className="text-gray-500">Have an account? </span>
                                <Link href="/login" className="font-bold text-blue-600 hover:underline">Sign In</Link>
                            </div>
                        </div>

                        {/* API Error Banner */}
                        {apiError && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium"
                            >
                                {apiError}
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {/* Row 1: Name */}
                            <div className="grid grid-cols-2 gap-4">
                                <AuthInput
                                    label="First Name"
                                    placeholder="Alex"
                                    icon={User}
                                    register={register("firstName")}
                                    error={errors.firstName}
                                    className="shadow-none"
                                    inputClassName="h-11 py-2.5 bg-gray-50 !border-2 !border-gray-300 !text-gray-900 shadow-sm focus:bg-white focus:!border-blue-500 placeholder:text-gray-400"
                                    labelClassName="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1"
                                />
                                <AuthInput
                                    label="Last Name"
                                    placeholder="Johnson"
                                    icon={User}
                                    register={register("lastName")}
                                    error={errors.lastName}
                                    className="shadow-none"
                                    inputClassName="h-11 py-2.5 bg-gray-50 !border-2 !border-gray-300 !text-gray-900 shadow-sm focus:bg-white focus:!border-blue-500 placeholder:text-gray-400"
                                    labelClassName="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1"
                                />
                            </div>

                            {/* Row 2: University & Programme */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs uppercase tracking-wider font-semibold text-gray-500 ml-1 block mb-1">University</label>
                                    <div className="relative">
                                        <select
                                            {...register("university")}
                                            suppressHydrationWarning
                                            className="w-full h-11 bg-gray-50 border-2 border-gray-300 rounded-xl px-4 py-2.5 pl-10 text-sm text-gray-900 placeholder-gray-500 outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none shadow-sm"
                                        >
                                            <option value="" className="bg-white text-gray-900">Select University</option>
                                            {UNIVERSITIES.map(u => (
                                                <option key={u.value} value={u.value} className="bg-white text-gray-900">{u.label}</option>
                                            ))}
                                        </select>
                                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                    </div>
                                    {errors.university && <p className="text-xs text-red-500 mt-0.5">{errors.university.message}</p>}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs uppercase tracking-wider font-semibold text-gray-500 ml-1 block mb-1">Programme</label>
                                    <div className="relative">
                                        <select
                                            {...register("programme")}
                                            suppressHydrationWarning
                                            className="w-full h-11 bg-gray-50 border-2 border-gray-300 rounded-xl px-4 py-2.5 pl-10 text-sm text-gray-900 placeholder-gray-500 outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none shadow-sm"
                                        >
                                            <option value="" className="bg-white text-gray-900">Select Programme</option>
                                            {PROGRAMMES.map(d => (
                                                <option key={d.value} value={d.value} className="bg-white text-gray-900">{d.label}</option>
                                            ))}
                                        </select>
                                        <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                    </div>
                                    {errors.programme && <p className="text-xs text-red-500 mt-0.5">{errors.programme.message}</p>}
                                </div>
                            </div>

                            {/* Row 3: Email & Graduation Year */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <AuthInput
                                        label="Email"
                                        type="email"
                                        placeholder="alex.j@university.edu"
                                        icon={Mail}
                                        register={register("email")}
                                        error={errors.email}
                                        className="shadow-none"
                                        inputClassName="h-11 py-2.5 bg-gray-50 !border-2 !border-gray-300 !text-gray-900 shadow-sm focus:bg-white focus:!border-blue-500 placeholder:text-gray-400"
                                        labelClassName="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs uppercase tracking-wider font-semibold text-gray-500 ml-1 block mb-1">Graduation</label>
                                    <div className="relative">
                                        <select
                                            {...register("graduationYear")}
                                            suppressHydrationWarning
                                            className="w-full h-11 bg-gray-50 border-2 border-gray-300 rounded-xl px-4 py-2.5 pl-10 text-sm text-gray-900 outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none shadow-sm"
                                        >
                                            <option value="" className="bg-white text-gray-900">Year</option>
                                            {GRADUATION_YEARS.map(y => (
                                                <option key={y.value} value={y.value} className="bg-white text-gray-900">{y.label}</option>
                                            ))}
                                        </select>
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                    </div>
                                    {errors.graduationYear && <p className="text-xs text-red-500 mt-0.5">{errors.graduationYear.message}</p>}
                                </div>
                            </div>

                            {/* Row 4: Passwords */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <AuthInput
                                        label="Password"
                                        type="password"
                                        placeholder="••••••••"
                                        icon={Lock}
                                        register={register("password")}
                                        error={errors.password}
                                        className="shadow-none"
                                        inputClassName="h-11 py-2.5 bg-gray-50 !border-2 !border-gray-300 !text-gray-900 shadow-sm focus:bg-white focus:!border-blue-500 placeholder:text-gray-400"
                                        labelClassName="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1"
                                    />
                                    {/* Strength Meter - Mini */}
                                    {password && (
                                        <div className="flex gap-1 h-1 mt-1 px-1">
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
                                    label="Confirm"
                                    type="password"
                                    placeholder="••••••••"
                                    icon={Lock}
                                    register={register("confirmPassword")}
                                    error={errors.confirmPassword}
                                    className="shadow-none"
                                    inputClassName="h-11 py-2.5 bg-gray-50 !border-2 !border-gray-300 !text-gray-900 shadow-sm focus:bg-white focus:!border-blue-500 placeholder:text-gray-400"
                                    labelClassName="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1"
                                />
                            </div>

                            <div className="pt-2">
                                <AuthCheckbox
                                    label={<span className="text-xs text-gray-600">I agree to <Link href="/terms" className="text-blue-600 hover:underline font-semibold">Terms</Link> & <Link href="/privacy" className="text-blue-600 hover:underline font-semibold">Privacy</Link></span>}
                                    register={register("agreeTerm")}
                                    error={errors.agreeTerm}
                                />
                            </div>

                            <GlassButton
                                type="submit"
                                variant="primary"
                                className="w-full py-3 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 rounded-xl"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating Account...
                                    </>
                                ) : "Create Account"}
                            </GlassButton>
                        </form>

                        <div className="my-6 flex items-center gap-4">
                            <div className="h-px bg-gray-200 flex-1" />
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Or continue with</span>
                            <div className="h-px bg-gray-200 flex-1" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button type="button" className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 transition-colors text-gray-700 font-medium text-sm shadow-sm">
                                <img src="https://authjs.dev/img/providers/google.svg" className="w-5 h-5" alt="Google" />
                                Google
                            </button>
                            <button type="button" className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 transition-colors text-gray-700 font-medium text-sm shadow-sm">
                                <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.35-1.09-.54-2.09-.5-3.14 0-.15.08-.3.17-.46.24-1.05.51-2.16.59-3.21-.44C3.89 17.5 3 13.78 6.07 10.95c1.12-1.04 2.57-1.12 3.8-.45.92.51 1.63.49 2.14 0 .97-.93 2.76-1.55 4.74-.29-2.06 1.45-1.6 4.96.48 6.22l-.18.35v.02c-.22.46-.5.91-.82 1.34-.34.46-.72.88-1.18 1.29-.12.11-.24.23-.36.33-.24.22-.43.39-.64.51M12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25" />
                                </svg>
                                Apple
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Back Button (Absolute Top Left) */}
            <Link
                href="/register"
                className="fixed top-6 left-6 p-2.5 rounded-full bg-white/80 backdrop-blur-md border border-gray-200 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer z-50 shadow-sm"
                aria-label="Back to Role Selection"
            >
                <ArrowLeft size={18} />
            </Link>
        </div>
    );
}

