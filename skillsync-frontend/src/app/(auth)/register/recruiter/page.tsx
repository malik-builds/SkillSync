"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Building2, MapPin, Globe, ArrowRight, Briefcase } from "lucide-react";
import { useState } from "react";

import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthSelect } from "@/components/auth/AuthSelect";
import { GlassButton } from "@/components/ui/GlassButton";
import { useAuth } from "@/lib/auth/AuthContext";

const step1Schema = z.object({
    firstName: z.string().min(2, "Required"),
    lastName: z.string().min(2, "Required"),
    email: z.string().email("Invalid email").refine(email => !email.endsWith("@gmail.com"), {
        message: "Please use a work email (no @gmail.com)",
    }),
    password: z.string().min(8, "Min 8 chars"),
});

const step2Schema = z.object({
    companyName: z.string().min(2, "Required"),
    industry: z.string().min(2, "Required"),
    size: z.string().min(1, "Select size"),
    location: z.string().min(2, "Required"),
    website: z.string().url("Invalid URL").optional().or(z.literal("")),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

const COMPANY_SIZES = [
    { value: "1-50", label: "1-50 Employees" },
    { value: "51-200", label: "51-200 Employees" },
    { value: "201-1000", label: "201-1,000 Employees" },
    { value: "1000+", label: "1,000+ Employees" },
];

export default function RecruiterRegisterPage() {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const form1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema) });
    const form2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema) });
    const { signUp } = useAuth();
    const [apiError, setApiError] = useState<string | null>(null);

    const onNext = async (data: Step1Data) => {
        setStep(2);
    };

    const onSubmit = async (data: Step2Data) => {
        setIsLoading(true);
        setApiError(null);
        try {
            const step1Data = form1.getValues();
            await signUp({
                fullName: `${step1Data.firstName} ${step1Data.lastName}`,
                email: step1Data.email,
                password: step1Data.password,
                role: "recruiter",
                termsAccepted: true
            });
            // Note: We could also call an API to save recruiter profile details (data) here
            router.push("/recruiter/dashboard");
        } catch (err: any) {
            setApiError(err.error || "Signup failed. Please try again.");
            setIsLoading(false);
        }
    };

    const marketingContent = (
        <div className="space-y-8">
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                        <Briefcase size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">The Trust Pipeline</h3>
                        <p className="text-sm text-gray-400">Verified Talent Only</p>
                    </div>
                </div>

                <div className="relative h-48 bg-black/20 rounded-xl overflow-hidden mb-6 flex items-center justify-center border border-white/5">
                    {/* Simulated Pipeline Animation */}
                    <div className="flex items-center gap-2">
                        <motion.div
                            animate={{ x: [0, 50, 100], opacity: [0, 1, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="bg-purple-500 w-3 h-3 rounded-full"
                        />
                        <motion.div
                            animate={{ x: [0, 50, 100], opacity: [0, 1, 0] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                            className="bg-blue-500 w-3 h-3 rounded-full"
                        />
                        <motion.div
                            animate={{ x: [0, 50, 100], opacity: [0, 1, 0] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                            className="bg-green-500 w-3 h-3 rounded-full"
                        />
                    </div>
                    <p className="absolute bottom-4 text-xs text-gray-500">AI Matching in Progress...</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                        <p className="text-2xl font-bold text-white">45%</p>
                        <p className="text-xs text-gray-400">Cost Reduced</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-white">2.5x</p>
                        <p className="text-xs text-gray-400">Faster Hiring</p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <AuthSplitLayout marketingContent={marketingContent}>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Recruiter Sign Up</h1>
                <p className="text-gray-600">
                    Step {step} of 2: {step === 1 ? "Your Identity" : "Company Details"}
                </p>
                {/* Progress Bar */}
                <div className="h-1 bg-white/10 w-full mt-4 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: "50%" }}
                        animate={{ width: step === 1 ? "50%" : "100%" }}
                        className="h-full bg-blue-600"
                    />
                </div>

                {apiError && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium animate-in fade-in slide-in-from-top-2">
                        {apiError}
                    </div>
                )}
            </div>

            <AnimatePresence mode="wait">
                {step === 1 ? (
                    <motion.form
                        key="step1"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        onSubmit={form1.handleSubmit(onNext)}
                        className="space-y-5"
                    >
                        <div className="grid grid-cols-2 gap-4">
                            <AuthInput label="First Name" placeholder="Jane" icon={User} register={form1.register("firstName")} error={form1.formState.errors.firstName} />
                            <AuthInput label="Last Name" placeholder="Smith" icon={User} register={form1.register("lastName")} error={form1.formState.errors.lastName} />
                        </div>
                        <AuthInput label="Work Email" type="email" placeholder="jane@company.com" icon={Mail} register={form1.register("email")} error={form1.formState.errors.email} />
                        <AuthInput label="Password" type="password" placeholder="••••••••" icon={Lock} register={form1.register("password")} error={form1.formState.errors.password} />

                        <GlassButton type="submit" variant="primary" className="w-full py-4 text-base font-bold bg-blue-600 hover:bg-blue-500 border-none flex items-center justify-center gap-2">
                            Next: Company Details <ArrowRight size={18} />
                        </GlassButton>
                    </motion.form>
                ) : (
                    <motion.form
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        onSubmit={form2.handleSubmit(onSubmit)}
                        className="space-y-5"
                    >
                        <AuthInput label="Company Name" placeholder="TechCorp Inc." icon={Building2} register={form2.register("companyName")} error={form2.formState.errors.companyName} />

                        <div className="grid grid-cols-2 gap-4">
                            <AuthInput label="Industry" placeholder="FinTech" icon={Briefcase} register={form2.register("industry")} error={form2.formState.errors.industry} />
                            <AuthSelect label="Company Size" options={COMPANY_SIZES} icon={Building2} register={form2.register("size")} error={form2.formState.errors.size} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <AuthInput label="Location" placeholder="Colombo, LK" icon={MapPin} register={form2.register("location")} error={form2.formState.errors.location} />
                            <AuthInput label="Website" placeholder="https://..." icon={Globe} register={form2.register("website")} error={form2.formState.errors.website} />
                        </div>

                        <div className="flex gap-4">
                            <GlassButton type="button" onClick={() => setStep(1)} className="flex-1 py-4 text-gray-700 hover:bg-gray-100 border border-gray-200">
                                Back
                            </GlassButton>
                            <GlassButton type="submit" variant="primary" className="flex-[2] py-4 text-base font-bold bg-green-600 hover:bg-green-500 border-none" disabled={isLoading}>
                                {isLoading ? "Creating..." : "Create Account"}
                            </GlassButton>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>
        </AuthSplitLayout>
    );
}
