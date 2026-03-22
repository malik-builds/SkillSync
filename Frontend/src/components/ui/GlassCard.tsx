import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

interface GlassCardProps extends HTMLMotionProps<"div"> {
    hoverEffect?: boolean;
}

export function GlassCard({ className, children, hoverEffect = false, ...props }: GlassCardProps) {
    return (
        <motion.div
            className={cn(
                "glass-card p-6",
                hoverEffect && "glass-card-hover cursor-pointer",
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    );
}
