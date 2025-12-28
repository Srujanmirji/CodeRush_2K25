import React from 'react';
import FlipDigit from './FlipDigit';

interface FlipClockProps {
    hours: number;
    minutes: number;
    seconds: number;
}

const FlipClock: React.FC<FlipClockProps> = ({ hours, minutes, seconds }) => {
    // Helper to split number into digits
    const getDigits = (num: number) => {
        const str = num.toString().padStart(2, '0');
        return [str[0], str[1]];
    };

    const [h1, h2] = getDigits(hours);
    const [m1, m2] = getDigits(minutes);
    const [s1, s2] = getDigits(seconds);

    const Separator = () => (
        <div className='flex flex-col gap-3 md:gap-4 pt-4 md:pt-14 opacity-80'>
            <div className="w-2 h-2 md:w-3 md:h-3 bg-cyan-400 rounded-full shadow-[0_0_15px_#00f0ff]"></div>
            <div className="w-2 h-2 md:w-3 md:h-3 bg-purple-500 rounded-full shadow-[0_0_15px_#a855f7]"></div>
        </div>
    );

    const GroupConfig = {
        width: "w-12 md:w-20",
        height: "h-20 md:h-32",
        textSize: "text-4xl md:text-7xl"
    }

    return (
        <div className="flex gap-3 md:gap-8 p-4 md:p-12 bg-black/40 backdrop-blur-2xl rounded-[2rem] md:rounded-[3rem] border border-white/5 shadow-[0_0_100px_rgba(0,100,255,0.1)] max-w-7xl mx-auto scale-90 md:scale-100 transition-transform">

            {/* HOURS */}
            <div className="flex flex-col items-center gap-4">
                <div className="flex gap-2">
                    <FlipDigit digit={h1} {...GroupConfig} />
                    <FlipDigit digit={h2} {...GroupConfig} />
                </div>
                <span className="text-cyan-400/70 text-[0.6rem] md:text-sm font-bold uppercase tracking-[0.3em] font-display">Hours</span>
            </div>

            <Separator />

            {/* MINUTES */}
            <div className="flex flex-col items-center gap-4">
                <div className="flex gap-2">
                    <FlipDigit digit={m1} {...GroupConfig} />
                    <FlipDigit digit={m2} {...GroupConfig} />
                </div>
                <span className="text-purple-400/70 text-[0.6rem] md:text-sm font-bold uppercase tracking-[0.3em] font-display">Minutes</span>
            </div>

            <Separator />

            {/* SECONDS */}
            <div className="flex flex-col items-center gap-4">
                <div className="flex gap-2">
                    <FlipDigit digit={s1} {...GroupConfig} />
                    <FlipDigit digit={s2} {...GroupConfig} />
                </div>
                <span className="text-cyan-400/70 text-[0.6rem] md:text-sm font-bold uppercase tracking-[0.3em] font-display">Seconds</span>
            </div>
        </div>
    );
};

export default FlipClock;
