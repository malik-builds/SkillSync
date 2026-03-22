"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface ModalContextType {
    isDemoOpen: boolean;
    openDemoModal: () => void;
    closeDemoModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
    const [isDemoOpen, setIsDemoOpen] = useState(false);

    const openDemoModal = () => setIsDemoOpen(true);
    const closeDemoModal = () => setIsDemoOpen(false);

    return (
        <ModalContext.Provider value={{ isDemoOpen, openDemoModal, closeDemoModal }}>
            {children}
        </ModalContext.Provider>
    );
}

export function useModal() {
    const context = useContext(ModalContext);
    if (context === undefined) {
        throw new Error("useModal must be used within a ModalProvider");
    }
    return context;
}
