"use client";

import { Check } from "lucide-react";
import { ApplicationStep } from "@/types/applications";

interface PipelineStepperProps {
    steps: ApplicationStep[];
}

export function PipelineStepper({ steps }: PipelineStepperProps) {
    const safeSteps = Array.isArray(steps) && steps.length > 0
        ? steps
        : [{ label: "Applied", status: "current" as const }];

    // Mobile View: Badge
    const currentStep = safeSteps.find(s => s.status === 'current') || safeSteps[safeSteps.length - 1];
    const stepIndex = safeSteps.indexOf(currentStep) + 1;

    return (
        <>
            {/* Mobile: Simple Status Badge */}
            <div className="md:hidden">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    {currentStep.label} (Step {stepIndex}/{safeSteps.length})
                </div>
            </div>

            {/* Desktop: Full Stepper */}
            <div className="hidden md:flex items-center justify-between w-full relative">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-0"></div>

                {safeSteps.map((step, i) => {
                    const isCompleted = step.status === 'completed';
                    const isCurrent = step.status === 'current';

                    return (
                        <div key={i} className="relative z-10 flex flex-col items-center gap-2 bg-white px-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${isCompleted ? "bg-green-500 border-green-500 text-white" :
                                isCurrent ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30 scale-110" :
                                    "bg-gray-50 border-gray-200 text-gray-400"
                                }`}>
                                {isCompleted ? <Check size={14} strokeWidth={3} /> : <span className="text-xs font-bold">{i + 1}</span>}
                            </div>
                            <span className={`text-xs font-bold ${isCurrent ? "text-blue-600" : "text-gray-500"}`}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </>
    );
}
