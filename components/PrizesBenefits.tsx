import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Award, Medal, Coffee, Users, Briefcase } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const perks = [
  {
    id: 1,
    icon: <Award className="w-10 h-10 text-cyber-blue" />,
    text: "Participation Certificates for All Registered Teams",
    color: "border-cyber-blue",
    shadow: "group-hover:shadow-[0_0_30px_rgba(0,240,255,0.3)]"
  },
  {
    id: 2,
    icon: <Medal className="w-10 h-10 text-yellow-400" />,
    text: "Winner Certificates for Top Teams",
    color: "border-yellow-400",
    shadow: "group-hover:shadow-[0_0_30px_rgba(250,204,21,0.3)]"
  },
  {
    id: 3,
    icon: <Coffee className="w-10 h-10 text-cyber-pink" />,
    text: "Free Refreshments Provided to All Participants",
    color: "border-cyber-pink",
    shadow: "group-hover:shadow-[0_0_30px_rgba(255,0,255,0.3)]"
  },
  {
    id: 4,
    icon: <Users className="w-10 h-10 text-green-400" />,
    text: "Live Networking with Developers & Mentors",
    color: "border-green-400",
    shadow: "group-hover:shadow-[0_0_30px_rgba(74,222,128,0.3)]"
  },
  {
    id: 5,
    icon: <Briefcase className="w-10 h-10 text-cyber-purple" />,
    text: "Resume & Portfolio Boost",
    color: "border-cyber-purple",
    shadow: "group-hover:shadow-[0_0_30px_rgba(112,0,255,0.3)]"
  }
];

const PrizesBenefits = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
        gsap.from(".perk-card", {
            scrollTrigger: {
                trigger: containerRef.current,
                start: "top 80%",
            },
            y: 50,
            opacity: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: "back.out(1.7)"
        });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="pb-0 pt-0 relative z-10 overflow-hidden">
        {/* Background Particles */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyber-blue/5 rounded-full blur-[80px]"></div>
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cyber-pink/5 rounded-full blur-[80px]"></div>
        </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center items-stretch">
            {perks.map((perk) => (
                <div 
                    key={perk.id} 
                    className={`perk-card group relative bg-cyber-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 
                               hover:-translate-y-3 transition-all duration-300 
                               hover:border-opacity-100 ${perk.color} ${perk.shadow}`}
                >
                    {/* Hover Glow Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"></div>
                    
                    <div className="relative z-10 flex flex-col items-center text-center h-full">
                        <div className="mb-6 p-5 rounded-full bg-black/50 border border-white/10 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 shadow-xl">
                            {perk.icon}
                        </div>
                        <h3 className="text-xl font-display font-bold text-gray-100 group-hover:text-white transition-colors leading-relaxed mb-2">
                            {perk.text}
                        </h3>
                        {/* Decorative line */}
                        <div className={`w-12 h-1 mt-auto rounded-full bg-current opacity-30 group-hover:opacity-100 transition-all duration-300 ${perk.color.replace('border-', 'bg-')}`}></div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </section>
  );
};

export default PrizesBenefits;