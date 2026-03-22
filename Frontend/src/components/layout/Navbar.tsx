"use client";

import Link from "next/link";
import { GlassButton } from "@/components/ui/GlassButton";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { ChevronDown, Menu, X } from "lucide-react";


import { useModal } from "@/lib/context/ModalContext";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const { openDemoModal } = useModal();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Apple-style Cubic Bezier
  const menuTransition = {
    type: "spring",
    mass: 0.5,
    damping: 11.5,
    stiffness: 100,
    restDelta: 0.001,
    restSpeed: 0.001,
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
          activeDropdown
            ? "bg-[#0A0A0B] border-transparent py-4"
            : "bg-[#0A0A0B]/80 backdrop-blur-md border-white/10 py-4 shadow-sm"
        )
        }
        onMouseLeave={() => setActiveDropdown(null)}
      >

        <div className="container mx-auto px-6 flex items-center justify-between relative z-50">
          {/* Brand */}
          <Link
            href="/"
            className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent tracking-tight z-50 relative"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            SkillSync
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {/* How It Works Trigger */}
            <div
              className="relative h-full flex items-center"
              onMouseEnter={() => setActiveDropdown('how-it-works')}
            >
              <button
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className={cn(
                  "text-sm font-medium transition-colors py-2 relative group",
                  activeDropdown === 'how-it-works' ? "text-blue-500" : "text-gray-300 hover:text-white"
                )}
              >
                How It Works
                <span className={cn(
                  "absolute -bottom-1 left-0 h-0.5 bg-blue-500 transition-all duration-300",
                  activeDropdown === 'how-it-works' ? "w-full" : "w-0 group-hover:w-full"
                )}></span>
              </button>
            </div>

            {/* Features Trigger */}
            <div
              className="relative h-full flex items-center"
              onMouseEnter={() => setActiveDropdown('features')}
            >
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className={cn(
                  "text-sm font-medium transition-colors py-2 relative group",
                  activeDropdown === 'features' ? "text-blue-500" : "text-gray-300 hover:text-white"
                )}
              >
                Features
                <span className={cn(
                  "absolute -bottom-1 left-0 h-0.5 bg-blue-500 transition-all duration-300",
                  activeDropdown === 'features' ? "w-full" : "w-0 group-hover:w-full"
                )}></span>
              </button>
            </div>

            <Link href="/#pricing" className="text-sm font-medium text-gray-300 hover:text-white transition-colors py-2 relative group" onMouseEnter={() => setActiveDropdown(null)}>
              Pricing
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link href="/about" className="text-sm font-medium text-gray-300 hover:text-white transition-colors py-2 relative group" onMouseEnter={() => setActiveDropdown(null)}>
              About
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link href="/contact" className="text-sm font-medium text-gray-300 hover:text-white transition-colors py-2 relative group" onMouseEnter={() => setActiveDropdown(null)}>
              Contact Us
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full"></span>
            </Link>
          </div>

          {/* Action Zone */}
          <div className="hidden md:flex items-center gap-4 z-50 relative">
            <Link href="/login">
              <GlassButton variant="ghost" size="sm" className="text-blue-400 border-blue-500/30 hover:bg-blue-500/10">
                Log In
              </GlassButton>
            </Link>
            <Link href="/register">
              <GlassButton
                variant="primary"
                size="sm"
                className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
              >
                Sign Up
              </GlassButton>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Full-Width Mega Menu Panel */}
        <AnimatePresence>
          {activeDropdown && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={menuTransition}
              className="absolute top-full left-0 right-0 w-full overflow-hidden bg-[#0A0A0B] border-b border-white/5 shadow-2xl z-40"
              onMouseEnter={() => setActiveDropdown(activeDropdown)}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <div className="container mx-auto px-6 py-12">
                {activeDropdown === 'how-it-works' && (
                  <div className="grid grid-cols-4 gap-12 animate-in fade-in slide-in-from-top-5 duration-500">
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">For Students</h3>
                      <Link href="/#students" className="group block">
                        <div className="font-bold text-lg text-white group-hover:text-blue-500 transition-colors">Skill Analysis</div>
                        <p className="text-sm text-gray-500 mt-1">Get AI-driven feedback on your code.</p>
                      </Link>
                      <Link href="/#students" className="group block">
                        <div className="font-bold text-lg text-white group-hover:text-blue-500 transition-colors">Learning Paths</div>
                        <p className="text-sm text-gray-500 mt-1">Custom curriculum to close gaps.</p>
                      </Link>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">For Recruiters</h3>
                      <Link href="/#recruiters" className="group block">
                        <div className="font-bold text-lg text-white group-hover:text-blue-500 transition-colors">Verified Pipeliens</div>
                        <p className="text-sm text-gray-500 mt-1">Hire candidates with proven skills.</p>
                      </Link>
                      <Link href="/#recruiters" className="group block">
                        <div className="font-bold text-lg text-white group-hover:text-blue-500 transition-colors">Smart Matching</div>
                        <p className="text-sm text-gray-500 mt-1">AI matches based on tech stack.</p>
                      </Link>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">For Universities</h3>
                      <Link href="/#universities" className="group block">
                        <div className="font-bold text-lg text-white group-hover:text-blue-500 transition-colors">Curriculum Insights</div>
                        <p className="text-sm text-gray-500 mt-1">Align degrees with industry demand.</p>
                      </Link>
                      <Link href="/#universities" className="group block">
                        <div className="font-bold text-lg text-white group-hover:text-blue-500 transition-colors">Student Tracking</div>
                        <p className="text-sm text-gray-500 mt-1">Monitor employablity metrics.</p>
                      </Link>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-6">
                      <h4 className="font-bold text-white mb-2">New to SkillSync?</h4>
                      <p className="text-sm text-gray-500 mb-4">See how we bridge the gap in 2 minutes.</p>
                      <Link href="/demo">
                        <span className="text-sm font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1">
                          Watch Demo <ChevronDown className="rotate-[-90deg] w-4 h-4" />
                        </span>
                      </Link>
                    </div>
                  </div>
                )}

                {activeDropdown === 'features' && (
                  <div className="grid grid-cols-4 gap-12 animate-in fade-in slide-in-from-top-5 duration-500">
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Core Tech</h3>
                      <Link href="/features/ai-matching" className="group block">
                        <div className="font-bold text-lg text-white group-hover:text-blue-500 transition-colors">AI Matching Engine</div>
                        <p className="text-sm text-gray-500 mt-1">Our proprietary matching algorithm.</p>
                      </Link>
                      <Link href="/features/github-scan" className="group block">
                        <div className="font-bold text-lg text-white group-hover:text-blue-500 transition-colors">GitHub Deep Scan</div>
                        <p className="text-sm text-gray-500 mt-1">Code quality analysis & verification.</p>
                      </Link>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Analytics</h3>
                      <Link href="/features/market-trends" className="group block">
                        <div className="font-bold text-lg text-white group-hover:text-blue-500 transition-colors">Market Trends</div>
                        <p className="text-sm text-gray-500 mt-1">Real-time demand forecasting.</p>
                      </Link>
                      <Link href="/features/skill-gap" className="group block">
                        <div className="font-bold text-lg text-white group-hover:text-blue-500 transition-colors">Skill Gap Reports</div>
                        <p className="text-sm text-gray-500 mt-1">Personalized improvement plans.</p>
                      </Link>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Integrations</h3>
                      <Link href="/features/lms" className="group block">
                        <div className="font-bold text-lg text-white group-hover:text-blue-500 transition-colors">LMS Connect</div>
                        <p className="text-sm text-gray-500 mt-1">Connect with Moodle & Canvas.</p>
                      </Link>
                      <Link href="/features/api" className="group block">
                        <div className="font-bold text-lg text-white group-hover:text-blue-500 transition-colors">Developers API</div>
                        <p className="text-sm text-gray-500 mt-1">Build on top of SkillSync.</p>
                      </Link>
                    </div>
                    <div className="bg-blue-900/10 rounded-2xl p-6 border border-blue-500/10">
                      <h4 className="font-bold text-blue-100 mb-2">Enterprise Plan</h4>
                      <p className="text-sm text-blue-300 mb-4">Custom solutions for large organizations.</p>
                      <Link href="/enterprise">
                        <GlassButton size="sm" variant="primary" className="w-full justify-center">Contact Sales</GlassButton>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Background Blur Overlay (Depth Effect) */}
      <AnimatePresence>
        {
          activeDropdown && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] pointer-events-none"
              style={{ top: '80px' }} // Start below navbar
            />
          )
        }
      </AnimatePresence >

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {
          isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              className="fixed inset-0 z-40 bg-black/95 backdrop-blur-xl md:hidden pt-24 px-6"
            >
              <div className="flex flex-col gap-6 text-lg">
                <Link href="/#students" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-300 hover:text-white">For Students</Link>
                <Link href="/#recruiters" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-300 hover:text-white">For Recruiters</Link>
                <Link href="/#universities" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-300 hover:text-white">For Universities</Link>
                <div className="h-px bg-white/10 my-2" />
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-blue-400">Log In</Link>
                <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="text-white font-bold">Sign Up</Link>
              </div>
            </motion.div>
          )
        }
      </AnimatePresence >
    </>
  );
}
