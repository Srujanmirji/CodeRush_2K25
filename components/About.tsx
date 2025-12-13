
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Database, Layout, Users } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const About = () => {
    const sectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(".about-text", {
                opacity: 0,
                y: 30,
                duration: 0.8,
                stagger: 0.2,
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top 80%",
                }
            });
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section id="about" ref={sectionRef} className="py-20 relative z-10 overflow-hidden">
            {/* Container */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
                        ABOUT THE <span className="text-cyber-pink">EVENT</span>
                    </h2>
                    <div className="w-24 h-1 bg-gradient-to-r from-cyber-blue to-cyber-pink mx-auto rounded-full"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    {/* Text Content */}
                    <div className="space-y-8 text-center md:text-left">
                        <p className="about-text text-xl text-gray-300 leading-relaxed font-sans">
                            <span className="text-cyber-blue font-bold">CodeRush 2K25</span> is a 6-hour hybrid hackathon that blends full-stack development with the creative energy of a vibeathon.
                        </p>

                        <div className="about-text space-y-4">
                            <p className="text-lg text-white font-bold uppercase tracking-wide">Participants are challenged to build:</p>
                            <ul className="space-y-3 inline-block text-left">
                                <li className="flex items-center gap-3 text-gray-400">
                                    <Database className="w-5 h-5 text-cyber-pink" />
                                    <span>A functional backend</span>
                                </li>
                                <li className="flex items-center gap-3 text-gray-400">
                                    <Layout className="w-5 h-5 text-cyber-blue" />
                                    <span>A polished frontend</span>
                                </li>
                                <li className="flex items-center gap-3 text-gray-400">
                                    <Users className="w-5 h-5 text-purple-400" />
                                    <span>And a delightful user experience</span>
                                </li>
                            </ul>
                        </div>

                        <p className="about-text text-xl font-display italic text-gray-200 border-l-4 border-cyber-pink pl-6 text-left">
                            "This event is not just about writing code fast — it’s about engineering solutions that work AND feel amazing."
                        </p>
                    </div>

                    {/* Visual / Graphic */}
                    <div className="about-text relative hidden md:block">
                        {/* Abstract decorative element */}
                        <div className="absolute inset-0 bg-gradient-to-r from-cyber-blue/20 to-cyber-pink/20 blur-3xl rounded-full opacity-30 animate-pulse"></div>
                        <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500 hover:shadow-[0_0_30px_rgba(0,240,255,0.2)]">
                            <div className="font-mono text-sm text-cyan-400 mb-2">// MISSION_OBJECTIVE</div>
                            <div className="text-3xl font-bold text-white mb-4">ENGINEER. <br /> DESIGN. <br /> DOMINATE.</div>
                            <div className="h-1 w-full bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-cyber-pink w-3/4 animate-[shimmer_2s_infinite]"></div>
                            </div>
                            <div className="mt-4 flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default About;
