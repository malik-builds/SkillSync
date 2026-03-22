"use client";

import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { Facebook, Twitter, Instagram, Linkedin, Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
    return (
        <footer className="relative pt-24 pb-12 overflow-hidden bg-blue-900 text-white">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px]" />
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="grid md:grid-cols-4 gap-12 mb-16">
                    {/* Brand Column */}
                    <div className="col-span-1 md:col-span-1">
                        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-200 to-white bg-clip-text text-transparent mb-6 block">
                            SkillSync
                        </Link>
                        <p className="text-blue-100/80 mb-6 leading-relaxed">
                            Bridging the gap between academic curriculum and industry demands through AI-driven insights.
                        </p>
                        <div className="flex gap-4">
                            {[
                                { Icon: Facebook, href: '#' },
                                { Icon: Twitter, href: '#' },
                                { Icon: Instagram, href: '#' },
                                { Icon: Linkedin, href: 'https://www.linkedin.com/company/iitskillsync/' },
                            ].map(({ Icon, href }, i) => (
                                <Link key={i} href={href} target="_blank" rel="noopener noreferrer">
                                    <GlassCard className="p-2 bg-white/10 hover:bg-white/20 border-white/10 cursor-pointer transition-colors w-10 h-10 flex items-center justify-center rounded-lg">
                                        <Icon className="w-5 h-5 text-white" />
                                    </GlassCard>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Links Column 1 */}
                    <div>
                        <h4 className="font-bold text-lg mb-6">Platform</h4>
                        <ul className="space-y-4">
                            <li><Link href="#" className="text-blue-100/80 hover:text-white transition-colors">For Students</Link></li>
                            <li><Link href="#" className="text-blue-100/80 hover:text-white transition-colors">For Recruiters</Link></li>
                            <li><Link href="#" className="text-blue-100/80 hover:text-white transition-colors">For Universities</Link></li>
                            <li><Link href="/#pricing" className="text-blue-100/80 hover:text-white transition-colors">Pricing</Link></li>
                        </ul>
                    </div>

                    {/* Links Column 2 */}
                    <div>
                        <h4 className="font-bold text-lg mb-6">Company</h4>
                        <ul className="space-y-4">
                            <li><Link href="/about" className="text-blue-100/80 hover:text-white transition-colors">About Us</Link></li>
                            <li><Link href="/careers" className="text-blue-100/80 hover:text-white transition-colors">Careers</Link></li>
                            <li><Link href="/blog" className="text-blue-100/80 hover:text-white transition-colors">Blog</Link></li>
                            <li><Link href="/contact" className="text-blue-100/80 hover:text-white transition-colors">Contact</Link></li>
                        </ul>
                    </div>

                    {/* Contact Column */}
                    <div>
                        <h4 className="font-bold text-lg mb-6">Contact</h4>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 text-blue-100/80">
                                <Mail className="w-5 h-5 mt-1 shrink-0" />
                                <span>contact@skillsync.lk</span>
                            </li>
                            <li className="flex items-start gap-3 text-blue-100/80">
                                <Phone className="w-5 h-5 mt-1 shrink-0" />
                                <span>+94 112 119 334</span>
                            </li>
                            <li className="flex items-start gap-3 text-blue-100/80">
                                <MapPin className="w-5 h-5 mt-1 shrink-0" />
                                <span>IIT City Campus<br />435 Galle Rd, Colombo 03,<br />Sri Lanka</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-blue-200/60">
                    <p suppressHydrationWarning>&copy; {new Date().getFullYear()} SkillSync. All rights reserved.</p>
                    <div className="flex gap-8">
                        <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
