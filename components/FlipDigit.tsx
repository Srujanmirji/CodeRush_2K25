import React, { useEffect, useState } from 'react';

interface FlipDigitProps {
    digit: string | number;
    width?: string;
    height?: string;
    textSize?: string;
}

const FlipDigit: React.FC<FlipDigitProps> = ({
    digit,
    width = "w-16 md:w-24",
    height = "h-24 md:h-36",
    textSize = "text-5xl md:text-7xl"
}) => {
    const [currentDigit, setCurrentDigit] = useState(digit);
    const [previousDigit, setPreviousDigit] = useState(digit);
    const [flipState, setFlipState] = useState<'idle' | 'flipping'>('idle');

    useEffect(() => {
        if (digit !== currentDigit) {
            setPreviousDigit(currentDigit);
            setCurrentDigit(digit);
            setFlipState('flipping');

            const timer = setTimeout(() => {
                setFlipState('idle');
                setPreviousDigit(digit);
            }, 600); // Matches CSS animation duration

            return () => clearTimeout(timer);
        }
    }, [digit, currentDigit]);

    // Visuals - Premium Tech Vibe
    const cardBg = "bg-[#0f0f13]";
    const cardBorder = "border-white/10";
    const textColor = "text-white";

    return (
        <div className={`relative ${width} ${height} perspective-1000`}>

            {/* STATIC TOP (Shows current digit immediately, waits for flip to cover it) */}
            <div className={`absolute top-0 w-full h-1/2 overflow-hidden ${cardBg} rounded-t-xl z-0 border-x border-t ${cardBorder} flex justify-center items-end`}>
                <span className={`${textSize} font-bold ${textColor} translate-y-[50%] drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]`}>
                    {currentDigit}
                </span>
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent"></div>
                <div className="absolute bottom-0 w-full h-[1px] bg-black/50"></div>
            </div>

            {/* STATIC BOTTOM (Shows previous digit until flip finishes?) 
                Actually: 
                - Static Top: Should be CURRENT digit (revealed after top flips down). 
                - Static Bottom: Should be previous digit (covered by top flipping down? No).
                
                Let's trace logic for a flip from 0 -> 1.
                - Top starts 0. Bottom starts 0.
                - Change to 1.
                - Front Top (Flip Down) starts at 0, flips down to reveal Back Top (which is 1).
                - Wait, standard flip clock mechanics:
                  - Top half: Current (Next) digit is underneath. Previous digit is on top, flipping down.
                  - Bottom half: Previous digit is underneath. Current (Next) digit is on top, flipping up? No.
                  
                Correct Mechanics:
                1. Upper Half Static: Next Digit (Waiting to be revealed)
                2. Lower Half Static: Previous Digit (Waiting to be covered)
                3. Upper Half Leaf: Previous Digit (Flips down to become lower half)
                4. Lower Half Leaf: Next Digit (Flips down? No, usually it's just one leaf flipping down).
                
                Let's simulate "Top Leaf flips down to become Bottom Leaf".
                
                - Static Top: NEXT Digit (1)
                - Static Bottom: PREV Digit (0)
                - Dynamic Top: PREV Digit (0) -> Flips down to cover Static Bottom.
                - Dynamic Bottom: NEXT Digit (1) -> Is the backface of Dynamic Top.
                
                Our current CSS has `flip-down` (top half anim) and `flip-up` (bottom half anim).
                Let's stick to the previous implementation's logic if it worked visually, just separating digits.
                
                Previous Logic:
                - Static Top: Current
                - Static Bottom: (Flipping ? Previous : Current)
                - Flipping Top: Previous (Visible if Flipping)
                - Flipping Bottom: Current (Visible if Flipping)
                
                This creates a 2-card effect meeting in middle.
            */}

            {/* STATIC TOP: Always shows Current Digit (what we are transitioning TO) */}
            <div className={`absolute top-0 w-full h-1/2 overflow-hidden ${cardBg} rounded-t-xl z-0 border-x border-t ${cardBorder} flex justify-center items-end`}>
                <span className={`${textSize} font-bold ${textColor} translate-y-[50%] drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]`}>
                    {currentDigit}
                </span>
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent"></div>
                <div className="absolute bottom-0 w-full h-[1px] bg-black/50"></div>
            </div>

            {/* STATIC BOTTOM: Shows Current if Idle, Previous if Flipping (so it stays visible while top flips down? No)
               If we are flipping T->B:
               - Top Previous flips down to cover Bottom Previous.
               - Background Bottom should be Current.
            */}
            <div className={`absolute bottom-0 w-full h-1/2 overflow-hidden ${cardBg} rounded-b-xl z-0 border-x border-b ${cardBorder} flex justify-center items-start`}>
                <span className={`${textSize} font-bold ${textColor} -translate-y-[50%] drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]`}>
                    {flipState === 'flipping' ? previousDigit : currentDigit}
                </span>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            </div>

            {/* FLIPPING TOP: Shows PREVIOUS digit. Flips DOWN. */}
            <div
                className={`absolute top-0 w-full h-1/2 overflow-hidden ${cardBg} rounded-t-xl z-20 border-x border-t ${cardBorder} flex justify-center items-end origin-bottom backface-hidden
                ${flipState === 'flipping' ? 'animate-flip-down' : 'invisible'}`}
            >
                <span className={`${textSize} font-bold ${textColor} translate-y-[50%] drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]`}>
                    {previousDigit}
                </span>
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent"></div>
                <div className="absolute bottom-0 w-full h-[1px] bg-black/50"></div>
            </div>

            {/* FLIPPING BOTTOM: Shows CURRENT digit. Flips UP (appears to be back of top). 
                Wait, if 'animate-flip-down' rotates X from 0 to -180.
                'animate-flip-up' rotates X from 180 to 0.
                
                If Top flips down (0 -> -180), it disappears (backface hidden).
                Bottom needs to start at 180 (hidden) and flip to 0 (visible).
            */}
            <div
                className={`absolute bottom-0 w-full h-1/2 overflow-hidden ${cardBg} rounded-b-xl z-20 border-x border-b ${cardBorder} flex justify-center items-start origin-top backface-hidden
                ${flipState === 'flipping' ? 'animate-flip-up' : 'invisible'}`}
            >
                <span className={`${textSize} font-bold ${textColor} -translate-y-[50%] drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]`}>
                    {currentDigit}
                </span>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            </div>

        </div>
    );
};

export default FlipDigit;
