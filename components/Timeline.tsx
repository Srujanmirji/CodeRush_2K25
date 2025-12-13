import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Calendar, Clock, Trophy, Flag, CheckCircle, ClipboardCheck, Mic, Rocket, Coffee, RefreshCw, AlertTriangle, Monitor } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const events = [
    {
        title: "Check-In",
        date: "09:00 AM",
        description: "Participant arrival, identity & payment verification, system allotment.",
        icon: <ClipboardCheck className="w-6 h-6 text-cyber-blue" />,
        color: "cyber-blue"
    },
    {
        title: "Opening Ceremony",
        date: "09:45 AM",
        description: "Welcome note, rules briefing, problem statement explanation.",
        icon: <Mic className="w-6 h-6 text-cyber-pink" />,
        color: "cyber-pink"
    },
    {
        title: "Hackathon Begins",
        date: "10:00 AM",
        description: "6 Hours Start! Teams start designing and developing their frontend projects.",
        icon: <Rocket className="w-6 h-6 text-cyber-purple" />,
        color: "cyber-purple"
    },
    {
        title: "Mid-Event Break",
        date: "12:00 PM",
        description: "Lunch Break. Short refreshment & rest break.",
        icon: <Coffee className="w-6 h-6 text-yellow-400" />,
        color: "yellow-400"
    },
    {
        title: "Hackathon Resumes",
        date: "01:00 PM",
        description: "Coding continues with mentor support & progress checks.",
        icon: <RefreshCw className="w-6 h-6 text-green-400" />,
        color: "green-400"
    },
    {
        title: "Final Submission Deadline",
        date: "03:45 PM",
        description: "All teams submit their project link & demo setup.",
        icon: <AlertTriangle className="w-6 h-6 text-red-500" />,
        color: "red-500"
    },
    {
        title: "Judging & Project Demos",
        date: "04:00 PM",
        description: "Teams present their solutions to the judging panel.",
        icon: <Monitor className="w-6 h-6 text-cyan-400" />,
        color: "cyan-400"
    },
    {
        title: "Results & Award Ceremony",
        date: "04:45 PM",
        description: "Winners announced, certificates and prizes distributed.",
        icon: <Trophy className="w-6 h-6 text-yellow-500" />,
        color: "yellow-500"
    }
];

const Timeline = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Animate Vertical Line
            gsap.fromTo(".timeline-line",
                { scaleY: 0 },
                {
                    scaleY: 1,
                    duration: 1.5,
                    ease: "power3.inOut",
                    scrollTrigger: {
                        trigger: containerRef.current,
                        start: "top 80%",
                        end: "bottom 20%",
                        scrub: 1
                    }
                }
            );

            // Animate Items
            const items = gsap.utils.toArray('.timeline-item');
            items.forEach((item: any, i) => {
                gsap.fromTo(item,
                    { autoAlpha: 0, x: i % 2 === 0 ? -50 : 50 },
                    {
                        autoAlpha: 1,
                        x: 0,
                        duration: 0.8,
                        ease: "power3.out",
                        scrollTrigger: {
                            trigger: item,
                            start: "top 85%",
                        }
                    }
                );
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section id="timeline" ref={containerRef} className="py-20 relative overflow-hidden">
            <div className="max-w-6xl mx-auto px-4 relative">
                <h2 className="text-4xl md:text-5xl font-display font-bold text-center text-white mb-4">
                    EVENT <span className="text-cyber-blue">TIMELINE</span>
                </h2>
                <p className="text-center text-cyber-pink font-mono text-lg mb-16 tracking-widest animate-pulse">
                    // 6 HOURS OF CODERUSH //
                </p>

                <div className="relative">
                    {/* Vertical Line */}
                    <div className="absolute left-[20px] md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-cyber-blue to-transparent timeline-line origin-top transform md:-translate-x-1/2" />

                    <div className="flex flex-col gap-12">
                        {events.map((event, index) => (
                            <div
                                key={index}
                                className={`timeline-item flex flex-col md:flex-row items-start ${index % 2 !== 0 ? 'md:flex-row-reverse' : ''} gap-8 relative`}
                            >
                                {/* Checkpoint Node */}
                                <div className="absolute left-[20px] md:left-1/2 w-4 h-4 rounded-full bg-cyber-black border-2 border-white z-10 transform -translate-x-1/2 mt-1.5 shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>

                                {/* Content Spacer for Desktop Alternation */}
                                <div className="w-full md:w-1/2" />

                                {/* Card */}
                                <div className="w-full md:w-1/2 pl-12 md:pl-0 md:px-8">
                                    <div className={`p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-${event.color}/50 transition-all duration-300 group hover:shadow-[0_0_20px_rgba(0,0,0,0.5)]`}>
                                        <div className="flex items-center gap-4 mb-3">
                                            <div className={`p-2 rounded-lg bg-${event.color}/10 hidden sm:block`}>
                                                {event.icon}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white font-display">{event.title}</h3>
                                                <span className={`text-${event.color} text-sm font-mono`}>{event.date}</span>
                                            </div>
                                        </div>
                                        <p className="text-gray-400 text-sm leading-relaxed border-l-2 border-white/10 pl-4">
                                            {event.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Timeline;
