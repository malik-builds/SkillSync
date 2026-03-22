"use client";

import { useState } from "react";
import { GlassButton } from "@/components/ui/GlassButton";

export function Pricing() {
    const [isYearly] = useState(false);

    // Define pricing
    const pricing = {
        standard: {
            monthly: 9.99,
            yearly: 99.99
        },
        pro: {
            monthly: 19.99,
            yearly: 199.99
        }
    };

    return (
        <section id="pricing" className="relative py-24 bg-[#0A0A0B] transition-colors duration-500 overflow-hidden font-sans">

            <div className="relative z-10 max-w-7xl mx-auto px-6">

                {/* Header */}
                <div className="text-center mb-24 relative z-20">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">Elevate your team</h2>
                    <p className="text-gray-400 text-lg">Choose a plan that fits your scale.</p>
                </div>

                {/* Overlap Container */}
                <div className="relative isolate pt-12">
                    {/* Watermark: Background Logic (Behind Cards) */}
                    <div className="absolute top-0 left-0 right-0 flex justify-center -translate-y-1/2 pointer-events-none select-none z-0">
                        <h1 className="text-[10rem] md:text-[14rem] font-black tracking-widest uppercase 
                                       text-white/80 transition-colors duration-500
                                       whitespace-nowrap leading-none scale-y-125 opacity-100">
                            Pricing
                        </h1>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center relative z-10">

                        {/* Free Plan */}
                        <div className="group relative p-8 rounded-[24px] transition-all duration-300 hover:-translate-y-2
                                        bg-white/5 
                                        backdrop-blur-[20px] 
                                        border border-white/10
                                        shadow-2xl">
                            {/* Inner Glow */}
                            <div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                            <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-bold text-white">$0</span>
                                <span className="text-gray-400">/mo</span>
                            </div>
                            <p className="text-gray-400 mb-8 text-sm">Perfect for individuals just starting out.</p>

                            <ul className="space-y-4 mb-8">
                                {['1 GitHub Repo Scan', 'Basic Skill Analysis', 'Public Profile'].map((feature) => (
                                    <li key={feature} className="flex items-center gap-3 text-sm text-gray-300">
                                        <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <GlassButton className="w-full bg-white/5 hover:bg-white/10 text-white border-white/10">
                                Get Started
                            </GlassButton>
                        </div>

                        {/* Pro Plan (Featured) */}
                        <div className="group relative p-10 rounded-[32px] transition-all duration-300 transform scale-105 z-20
                                        bg-white/10 
                                        backdrop-blur-[30px] 
                                        border border-blue-500/30
                                        shadow-[0_0_50px_rgba(59,130,246,0.15)]">
                            <div className="absolute -top-5 left-0 right-0 flex justify-center">
                                <span className="bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg tracking-wider uppercase">Most Popular</span>
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-5xl font-bold text-white">${isYearly ? pricing.standard.yearly : pricing.standard.monthly}</span>
                                <span className="text-gray-400">/{isYearly ? 'yr' : 'mo'}</span>
                            </div>
                            <p className="text-blue-200 mb-8 text-sm">For serious developers growing their career.</p>

                            <ul className="space-y-4 mb-8">
                                {['Unlimited Repo Scans', 'Advanced AI Analysis', 'Verified Badges', 'Priority Support'].map((feature) => (
                                    <li key={feature} className="flex items-center gap-3 text-sm text-white">
                                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/50">
                                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <GlassButton
                                variant="primary"
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white border-none shadow-lg shadow-blue-600/20 py-4 text-lg"
                            >
                                Start Free Trial
                            </GlassButton>
                        </div>

                        {/* Enterprise Plan */}
                        <div className="group relative p-8 rounded-[24px] transition-all duration-300 hover:-translate-y-2
                                        bg-white/5 
                                        backdrop-blur-[20px] 
                                        border border-white/10
                                        shadow-2xl">
                            {/* Inner Glow */}
                            <div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                            <h3 className="text-xl font-bold text-white mb-2">Enterprise</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-bold text-white">Custom</span>
                            </div>
                            <p className="text-gray-400 mb-8 text-sm">For large teams and universities.</p>

                            <ul className="space-y-4 mb-8">
                                {['SSO Integration', 'Custom Contracts', 'Dedicated Success Manager', 'API Access'].map((feature) => (
                                    <li key={feature} className="flex items-center gap-3 text-sm text-gray-300">
                                        <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                                            <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <GlassButton className="w-full bg-white/5 hover:bg-white/10 text-white border-white/10">
                                Contact Sales
                            </GlassButton>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
}