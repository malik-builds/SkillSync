"use client";

import { useModal } from "@/lib/context/ModalContext";
import { AnimatePresence, motion } from "framer-motion";
import { X, Clock, Globe, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns";
import { cn } from "@/lib/utils";

export function DemoBookingModal() {
    const { isDemoOpen, closeDemoModal } = useModal();
    const [currentMonth, setCurrentMonth] = useState<Date | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [timezone, setTimezone] = useState("India Standard Time (IST)");

    // Initialize dates on client only to avoid hydration mismatch
    useEffect(() => {
        const now = new Date();
        setCurrentMonth(now);
        setSelectedDate(now);
    }, []);

    // Provide safe defaults during hydration
    const today = currentMonth || new Date();
    const selectedDateToUse = selectedDate || new Date();

    // Calendar Logic
    const nextMonth = () => setCurrentMonth(currentMonth ? addMonths(currentMonth, 1) : addMonths(new Date(), 1));
    const prevMonth = () => setCurrentMonth(currentMonth ? subMonths(currentMonth, 1) : subMonths(new Date(), 1));

    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const weekDays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

    // Mock Time Slots
    const timeSlots = [
        "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM",
        "02:00 PM", "02:30 PM", "03:00 PM", "04:30 PM"
    ];

    if (!isDemoOpen) return null;

    return (
        <AnimatePresence>
            {isDemoOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeDemoModal}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />

                    {/* Modal Container */}
                    <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-4xl flex flex-col md:flex-row max-h-[90vh]"
                        >
                            {/* Left Panel: Info */}
                            <div className="md:w-1/3 bg-gray-50 p-6 border-r border-gray-100 flex flex-col relative">
                                <div className="mb-8">
                                    <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">SkillSync</h3>
                                </div>

                                <div className="flex-1">
                                    <div className="mb-6">
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-0.5 mb-4">
                                            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Host" className="w-full h-full object-cover" />
                                            </div>
                                        </div>
                                        <p className="text-gray-500 text-sm font-medium mb-1">Dr. Aruna Perera</p>
                                        <h2 className="text-2xl font-bold text-gray-900 leading-tight">Demo: Getting Started with SkillSync</h2>
                                    </div>

                                    <div className="space-y-4 text-gray-600">
                                        <div className="flex items-center gap-3">
                                            <Clock className="w-5 h-5 text-gray-400" />
                                            <span className="font-medium">30 min</span>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Globe className="w-5 h-5 text-gray-400 mt-1" />
                                            <span className="text-sm">Web conferencing details provided upon confirmation.</span>
                                        </div>
                                    </div>

                                    <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                        <p className="text-sm text-blue-800 leading-relaxed">
                                            &quot;See how SkillSync bridges the gap between your curriculum and industry demands.&quot;
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-gray-200">
                                    <button className="text-xs text-gray-400 hover:text-gray-600 underline">Cookie settings</button>
                                </div>
                            </div>

                            {/* Right Panel: Calendar & Time */}
                            <div className="md:w-2/3 p-6 bg-white overflow-hidden flex flex-col">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-bold text-gray-900">Select a Date & Time</h3>
                                    <button onClick={closeDemoModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                        <X className="w-5 h-5 text-gray-400" />
                                    </button>
                                </div>

                                {/* Calendar Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <span className="text-lg font-semibold text-gray-900">
                                        {format(today, "MMMM yyyy")}
                                    </span>
                                    <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Calendar Grid */}
                                <div className="mb-4">
                                    <div className="grid grid-cols-7 mb-4">
                                        {weekDays.map(day => (
                                            <div key={day} className="text-center text-xs font-semibold text-gray-400">
                                                {day}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-7 gap-1">
                                        {calendarDays.map((day, idx) => {
                                            const isSelected = isSameDay(day, selectedDateToUse);
                                            const isCurrentMonth = isSameMonth(day, today);
                                            const isTodayDate = isToday(day);

                                            return (
                                                <div key={idx} className="aspect-square p-1">
                                                    <button
                                                        onClick={() => setSelectedDate(day)}
                                                        disabled={!isCurrentMonth}
                                                        className={cn(
                                                            "w-full h-full rounded-full flex items-center justify-center text-sm transition-all relative",
                                                            !isCurrentMonth && "text-gray-200 cursor-default",
                                                            isCurrentMonth && !isSelected && "text-gray-700 hover:bg-blue-50 hover:text-blue-600",
                                                            isSelected && "bg-blue-600 text-white shadow-md font-semibold",
                                                            isTodayDate && !isSelected && "text-blue-600 font-bold bg-blue-50"
                                                        )}
                                                    >
                                                        {format(day, "d")}
                                                        {isTodayDate && !isSelected && (
                                                            <div className="absolute bottom-1.5 w-1 h-1 bg-blue-600 rounded-full"></div>
                                                        )}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Time Slots */}
                                <div className="mb-4 flex-1 overflow-y-auto min-h-0">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-4">Available Times ({selectedDate ? format(selectedDate, "MMM d") : "Select date"})</h4>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                        {timeSlots.map((time) => (
                                            <button
                                                key={time}
                                                onClick={() => setSelectedTime(time)}
                                                className={cn(
                                                    "py-2 px-3 rounded-lg text-sm font-medium border transition-all",
                                                    selectedTime === time
                                                        ? "bg-blue-600 border-blue-600 text-white shadow-md"
                                                        : "border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600"
                                                )}
                                            >
                                                {time}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Timezone & Confirm */}
                                <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-gray-100 gap-4 mt-auto">
                                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors w-full sm:w-auto">
                                        <Globe className="w-4 h-4" />
                                        <span>{timezone}</span>
                                        <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
                                    </div>

                                    <button
                                        onClick={closeDemoModal}
                                        disabled={!selectedDate || !selectedTime}
                                        className={cn(
                                            "px-8 py-3 rounded-xl font-bold transition-all w-full sm:w-auto",
                                            selectedDate && selectedTime
                                                ? "bg-black text-white hover:bg-gray-800 shadow-lg"
                                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        )}
                                    >
                                        Confirm Booking
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}

function ChevronDown({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
    )
}
