"use client";

import { StudentSidebar } from "@/components/layout/StudentSidebar";
// We might need a context or store to manage the "locked" state globally if the sidebar needs to be disabled 
// based on the dashboard state. For now, we'll assume the sidebar is always enabled in the layout, 
// and the dashboard page handles the overlay/blur. 
// However, the requirement was "Sidebar also must be shown here, but they are like grayed out".
// Since the layout wraps the page, we might need a way to pass this state.
// For the MVP, we can keep the sidebar enabled to allow navigation to Profile/Settings even in Zero State,
// OR we can lift the state up. 
// Given the "Glass Overlay" requirement, it's visually better if the sidebar is also blurred.
// I will implement the layout to accept a prop or just render the sidebar, and let the Page handle the full-screen blur/overlay 
// by positioning the overlay `fixed inset-0 z-50`.

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[#F5F7FA] text-gray-900 selection:bg-blue-500/20">
            <StudentSidebar />
            <main className="md:ml-[280px] min-h-screen relative transition-all duration-300">
                {children}
            </main>
        </div>
    );
}
