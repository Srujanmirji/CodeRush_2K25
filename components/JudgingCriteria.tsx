import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Layers, Lightbulb, Smartphone, Zap, Code2, Cpu } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const criteria = [
  { id: 1, title: 'UI / Visual Design', weight: '30%', icon: <Layers className="w-6 h-6" />, color: 'bg-cyber-pink', shadow: 'shadow-[0_0_20px_#ff00ff]' },
  { id: 2, title: 'Creativity & Innovation', weight: '20%', icon: <Lightbulb className="w-6 h-6" />, color: 'bg-cyber-blue', shadow: 'shadow-[0_0_20px_#00f0ff]' },
  { id: 3, title: 'Responsiveness & UX', weight: '20%', icon: <Smartphone className="w-6 h-6" />, color: 'bg-cyber-purple', shadow: 'shadow-[0_0_20px_#7000ff]' },
  { id: 4, title: 'Animations & Effects', weight: '15%', icon: <Zap className="w-6 h-6" />, color: 'bg-yellow-400', shadow: 'shadow-[0_0_20px_#facc15]' },
  { id: 5, title: 'Performance & Code Quality', weight: '15%', icon: <Code2 className="w-6 h-6" />, color: 'bg-green-400', shadow: 'shadow-[0_0_20px_#4ade80]' },
];

const JudgingCriteria = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate progress bars filling up
      barsRef.current.forEach((bar) => {
        if (!bar) return;
        const width = bar.dataset.width;
        
        gsap.fromTo(bar, 
          { width: '0%' },
          {
            width: width,
            duration: 1.5,
            ease: "power2.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 75%",
            }
          }
        );
      });

      // Animate container entrance
      gsap.from(sectionRef.current, {
        opacity: 0,
        y: 50,
        duration: 1,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="pt-0 pb-16 relative z-10" ref={sectionRef}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4 flex items-center justify-center gap-4">
            <Cpu className="w-10 h-10 text-cyber-blue animate-pulse" />
            JUDGING <span className="text-cyber-pink">CRITERIA</span>
          </h2>
          <p className="text-gray-400 font-mono text-sm tracking-widest uppercase">
            // Evaluation Matrix Loaded
          </p>
        </div>

        <div className="bg-cyber-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden group hover:border-cyber-blue/30 transition-all duration-500">
            {/* Background Grid */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" 
                 style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>

            <div className="space-y-8 relative z-10">
              {criteria.map((item, idx) => (
                <div key={item.id} className="relative group/item">
                  {/* Header */}
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex items-center gap-3 text-gray-200 group-hover/item:text-white transition-colors">
                      <div className={`p-2 rounded bg-white/5 border border-white/10 group-hover/item:border-white/30 transition-all ${item.shadow.replace('20px', '5px')}`}>
                        {item.icon}
                      </div>
                      <span className="font-display tracking-wide text-lg md:text-xl">{item.title}</span>
                    </div>
                    <span className="font-mono text-cyber-blue font-bold">{item.weight}</span>
                  </div>

                  {/* 3D Progress Bar Container */}
                  <div className="h-4 bg-black/60 rounded-full border border-white/10 overflow-hidden relative shadow-inner transform perspective-500 hover:scale-[1.01] transition-transform">
                    
                    {/* The Fill Bar */}
                    <div 
                      ref={el => { barsRef.current[idx] = el; }}
                      data-width={item.weight}
                      className={`h-full ${item.color} ${item.shadow} relative`}
                      style={{ width: '0%' }}
                    >
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full -translate-x-full animate-[shimmer_2s_infinite]"></div>
                    </div>

                  </div>
                </div>
              ))}
            </div>

            {/* Decorative Corner Elements */}
            <div className="absolute top-0 right-0 w-24 h-24 border-t-2 border-r-2 border-cyber-pink/20 rounded-tr-3xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 border-b-2 border-l-2 border-cyber-blue/20 rounded-bl-3xl"></div>
        </div>

      </div>
    </section>
  );
};

export default JudgingCriteria;