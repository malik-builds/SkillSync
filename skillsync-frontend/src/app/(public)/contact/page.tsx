"use client";

import { useState } from "react";
import { GlassButton } from "@/components/ui/GlassButton";
import { Mail, MessageSquare, User, Send, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));

        setIsSubmitting(false);
        setIsSubmitted(true);

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen pt-32 pb-32 bg-white">
            <div className="container mx-auto px-6 max-w-md">
                {isSubmitted ? (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center py-12"
                    >
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2 text-gray-900">
                            Message Sent!
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Thank you for contacting us. We&apos;ll get back to you soon.
                        </p>
                        <button
                            onClick={() => {
                                setIsSubmitted(false);
                                setFormData({
                                    name: "",
                                    email: "",
                                    subject: "",
                                    message: "",
                                });
                            }}
                            className="text-blue-600 hover:text-blue-700 hover:underline font-bold"
                        >
                            Send Another Message
                        </button>
                    </motion.div>
                ) : (
                    <>
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Get in Touch</h1>
                            <p className="text-gray-500">
                                Have questions about SkillSync? We&apos;d love to hear from you.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Name */}
                            <div className="space-y-2 group">
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 group-focus-within:text-blue-600 transition-colors">
                                    Name
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                                        <User size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        placeholder="John Doe"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full h-11 py-2.5 bg-gray-50 !border-2 !border-gray-300 text-gray-900 shadow-sm focus:bg-white focus:!border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-gray-400 rounded-xl px-4 pl-12 outline-none transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-2 group">
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 group-focus-within:text-blue-600 transition-colors">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                                        <Mail size={20} />
                                    </div>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        placeholder="name@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full h-11 py-2.5 bg-gray-50 !border-2 !border-gray-300 text-gray-900 shadow-sm focus:bg-white focus:!border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-gray-400 rounded-xl px-4 pl-12 outline-none transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Subject */}
                            <div className="space-y-2 group">
                                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 group-focus-within:text-blue-600 transition-colors">
                                    Subject
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                                        <MessageSquare size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        id="subject"
                                        name="subject"
                                        placeholder="How can we help?"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        className="w-full h-11 py-2.5 bg-gray-50 !border-2 !border-gray-300 text-gray-900 shadow-sm focus:bg-white focus:!border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-gray-400 rounded-xl px-4 pl-12 outline-none transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Message */}
                            <div className="space-y-2 group">
                                <label htmlFor="message" className="block text-sm font-medium text-gray-700 group-focus-within:text-blue-600 transition-colors">
                                    Message
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-3 text-gray-500 pointer-events-none">
                                        <Send size={20} />
                                    </div>
                                    <textarea
                                        id="message"
                                        name="message"
                                        rows={5}
                                        placeholder="Tell us more about your inquiry..."
                                        value={formData.message}
                                        onChange={handleChange}
                                        className="w-full py-2.5 bg-gray-50 !border-2 !border-gray-300 text-gray-900 shadow-sm focus:bg-white focus:!border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-gray-400 rounded-xl px-4 pl-12 outline-none transition-all resize-none"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <GlassButton
                                type="submit"
                                variant="primary"
                                className="w-full py-4 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 border-none"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                                ) : (
                                    "Send Message"
                                )}
                            </GlassButton>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
