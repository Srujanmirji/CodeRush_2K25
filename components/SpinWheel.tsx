import React, { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface SpinWheelProps {
    spinning: boolean;
    onSpinEnd: (domain: string) => void;
    segments?: { label: string; color: string; textColor?: string }[];
}

const SpinWheel: React.FC<SpinWheelProps> = ({ spinning, onSpinEnd, segments: propsSegments }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [rotation, setRotation] = useState(0);

    // Configuration - Use props or default
    const segments = propsSegments || [
        { label: "AI in Agriculture", color: "#10B981", textColor: "#ffffff" }, // Emerald
        { label: "AI in Healthcare", color: "#EF4444", textColor: "#ffffff" }, // Red
        { label: "AI in Finance", color: "#F59E0B", textColor: "#ffffff" }, // Amber
        { label: "AI in Education", color: "#3B82F6", textColor: "#ffffff" }, // Blue
    ];

    const spinVelocityRef = useRef(0);
    const isSpinningRef = useRef(false);
    const animationFrameRef = useRef<number | undefined>(undefined);

    // Draw Wheel
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const draw = () => {
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radius = canvas.width / 2 - 20;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw Outer Ring (Neon Glow)
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius + 10, 0, 2 * Math.PI);
            ctx.strokeStyle = '#00f0ff'; // Cyan Neon
            ctx.lineWidth = 15;
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 20;
            ctx.stroke();
            ctx.shadowBlur = 0; // Reset shadow

            // Draw Segments
            const sliceAngle = (2 * Math.PI) / segments.length;

            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(rotation); // Apply rotation

            segments.forEach((segment, i) => {
                const angle = i * sliceAngle;

                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.arc(0, 0, radius, angle, angle + sliceAngle);
                ctx.closePath();

                ctx.fillStyle = segment.color;
                ctx.fill();
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Text Rendering
                ctx.save();
                ctx.rotate(angle + sliceAngle / 2);
                ctx.textAlign = "right";
                ctx.textBaseline = "middle";
                ctx.fillStyle = segment.textColor || "#ffffff"; // Default to white
                ctx.font = "bold 14px sans-serif";
                ctx.fillText(segment.label, radius - 20, 0);
                ctx.restore();
            });

            ctx.restore();

            // Draw Center Cap
            ctx.beginPath();
            ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
            ctx.fillStyle = '#111';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 4;
            ctx.stroke();

            // Draw Center Text (CodeRush)
            ctx.fillStyle = '#fff';
            ctx.font = "bold 10px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("CR25", centerX, centerY);

            // Draw Pointer (Static at top)
            ctx.beginPath();
            ctx.moveTo(centerX, centerY - radius + 20);
            ctx.lineTo(centerX - 15, centerY - radius - 20);
            ctx.lineTo(centerX + 15, centerY - radius - 20);
            ctx.closePath();
            ctx.fillStyle = '#fff';
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 10;
            ctx.fill();
        };

        draw();
    }, [rotation, segments]);

    // Handle Spin Logic
    useEffect(() => {
        if (spinning && !isSpinningRef.current) {
            isSpinningRef.current = true;

            // 1. Pick a Random Winner Deterministically
            const randomIndex = Math.floor(Math.random() * segments.length);
            const winningSegment = segments[randomIndex];

            // 2. Calculate Target Angle
            // We want the MIDDLE of this segment to land at 270 degrees (Top)
            const sliceDeg = 360 / segments.length;
            const segmentCenterDeg = (randomIndex * sliceDeg) + (sliceDeg / 2);

            // Current rotation
            // We want: (FinalRotation + SegmentCenter) % 360 = 270
            // FinalRotation = 270 - SegmentCenter
            // Add extra spins (e.g. 5 full spins + noise to land in middle)
            // Actually, let's target the exact center to be safe and clean.

            let targetDeg = 270 - segmentCenterDeg;
            // Ensure positive moves or just add 360s
            // We usually want to spin clockwise (positive rotation)
            // So find the next multiple of 360 that is > currentRotation + MinSpins

            const currentDeg = (rotation * 180 / Math.PI);
            const minSpins = 5 * 360;
            const targetBase = currentDeg + minSpins;

            // Adjust targetDeg to be relative to targetBase
            // We want (targetBase + adjustment) % 360 === targetDeg % 360

            // Easier way:
            // Calculate offset needed
            // diff = target - current % 360
            // if diff < 0 diff += 360

            const currentMod = currentDeg % 360;
            let diff = targetDeg - currentMod;
            if (diff < 0) diff += 360;

            const finalTargetDeg = currentDeg + minSpins + diff;
            const finalTargetRad = finalTargetDeg * Math.PI / 180;

            // 3. Animate using Easing
            const startTime = performance.now();
            const duration = 4000; // 4 seconds spin
            const startRotation = rotation;
            const changeInRotation = finalTargetRad - startRotation;

            const animate = (currentTime: number) => {
                const elapsed = currentTime - startTime;

                if (elapsed >= duration) {
                    setRotation(finalTargetRad);
                    isSpinningRef.current = false;
                    onSpinEnd(winningSegment.label);
                    return;
                }

                // Ease Out Cubic
                let t = elapsed / duration;
                t--;
                const easeOut = t * t * t + 1;

                const newRotation = startRotation + (changeInRotation * easeOut);
                setRotation(newRotation);

                animationFrameRef.current = requestAnimationFrame(animate);
            };

            animationFrameRef.current = requestAnimationFrame(animate);
        }
    }, [spinning, segments, onSpinEnd]);

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                Random Domain Selector
            </h3>

            <div className="relative">
                <canvas
                    ref={canvasRef}
                    width={400}
                    height={400}
                    className="max-w-full h-auto drop-shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                />
            </div>

            <p className="mt-8 text-gray-400 text-sm font-mono uppercase tracking-widest text-center">
                {spinning ? "Spinning..." : "Ready to Assign"}
            </p>
        </div>
    );
};

export default SpinWheel;
