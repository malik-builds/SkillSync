"use client";

export function HeroVideo() {
    return (
        <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
            <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
                poster="/images/video-poster.jpg"
            >
                <source src="/hero-video.mp4" type="video/mp4" />
            </video>

            {/* Gradient Overlay for Text Readability - Left Heavy - Forced Dark Mode Style */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0B] via-[#0A0A0B]/70 to-transparent z-10" />

            {/* Additional subtle blur for the very left edge - Forced Dark Mode Style */}
            <div className="absolute inset-y-0 left-0 w-1/3 bg-black/30 backdrop-blur-[2px] z-10 masking-gradient" style={{ maskImage: 'linear-gradient(to right, black, transparent)' }} />
        </div>
    );
}
