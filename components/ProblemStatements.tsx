import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Shield, Lock, Users, Code, Gavel, Upload, Heart, AlertTriangle, Laptop } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const rules = [
  {
    id: 1,
    icon: <Code className="w-8 h-8 text-cyber-blue" />,
    text: "Teams must build both frontend and backend."
  },
  {
    id: 2,
    icon: <Users className="w-8 h-8 text-cyber-purple" />,
    text: "Any tech stack allowed (React, Node, Django, Firebase, etc.)."
  },
  {
    id: 3,
    icon: <Shield className="w-8 h-8 text-red-500" />,
    text: "Backend APIs must be functional (mock data allowed only if justified)."
  },
  {
    id: 4,
    icon: <Upload className="w-8 h-8 text-cyber-pink" />,
    text: "Focus on original work. Plagiarism leads to immediate disqualification."
  },
  {
    id: 5,
    icon: <Heart className="w-8 h-8 text-green-400" />,
    text: "No pre-built templates or full boilerplates. Open-source libraries are allowed."
  },
  {
    id: 6,
    icon: <Gavel className="w-8 h-8 text-yellow-400" />,
    text: "Judges’ decision will be final."
  },
  {
    id: 7,
    icon: <Users className="w-8 h-8 text-white" />,
    text: "Teams can consist of 1 to 2 members only."
  },
  {
    id: 8,
    icon: <Laptop className="w-8 h-8 text-cyber-blue" />,
    text: "Everyone should bring their own laptop."
  }
];

const ThemeAndRules = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const themeCardRef = useRef<HTMLDivElement>(null);
  const ruleCardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Theme Card Animation
      gsap.from(themeCardRef.current, {
        scrollTrigger: {
          trigger: themeCardRef.current,
          start: "top 85%",
        },
        scale: 0.9,
        opacity: 0,
        duration: 1,
        ease: "elastic.out(1, 0.5)"
      });

      // Rules Stagger Animation
      gsap.from(ruleCardsRef.current, {
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 75%",
        },
        y: 50,
        rotationX: 15,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power2.out"
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="rules" className="pt-10 pb-16 relative z-10 overflow-hidden" ref={containerRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">

        {/* THEME SECTION */}
        <div className="mb-20 relative z-10">
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              PROBLEM <span className="text-cyber-pink">STATEMENTS</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-cyber-blue to-transparent mx-auto"></div>
          </div>

          <div
            ref={themeCardRef}
            className="relative max-w-4xl mx-auto group perspective-1000"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyber-blue/20 via-cyber-purple/20 to-cyber-pink/20 blur-xl group-hover:blur-3xl transition-all duration-500 opacity-50 group-hover:opacity-100"></div>
            <div className="relative bg-cyber-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 md:p-12 text-center overflow-hidden transform transition-transform duration-500 group-hover:scale-[1.02] shadow-2xl">
              {/* Animated Grid Background */}
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#4a5568 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

              <Lock className="w-16 h-16 text-cyber-blue mx-auto mb-6 animate-pulse" />

              <h3 className="text-3xl md:text-5xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 mb-4 tracking-wider uppercase glitch-text" data-text="REVEALED ON THE SPOT">
                REVEALED ON THE SPOT
              </h3>

              <p className="text-cyber-pink font-mono text-lg animate-pulse">
                        // AWAITING DECRYPTION...
              </p>
            </div>
          </div>
        </div>

        {/* RULES SECTION */}
        <div className="relative">
          {/* Background elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-cyber-purple/5 blur-[100px] rounded-full pointer-events-none"></div>

          <div className="text-center mb-12 relative z-10">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4 flex items-center justify-center gap-3">
              <AlertTriangle className="text-yellow-400 w-8 h-8" />
              RULES & <span className="text-cyber-blue">GUIDELINES</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Adherence to these protocols is mandatory.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
            {rules.map((rule, idx) => (
              <div
                key={rule.id}
                ref={(el) => { ruleCardsRef.current[idx] = el; }}
                className="group relative h-full"
              >
                {/* 3D Card Container */}
                <div className="h-full bg-cyber-black/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 sm:p-8 
                                      transition-all duration-500 ease-out
                                      hover:bg-white/10 hover:border-cyber-blue/30 
                                      hover:shadow-[0_20px_40px_-15px_rgba(0,240,255,0.2)]
                                      hover:[transform:perspective(1000px)_translateY(-10px)_rotateX(2deg)]"
                >
                  <div className="flex flex-col h-full">
                    {/* Icon Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 
                                                  group-hover:bg-cyber-blue/10 group-hover:border-cyber-blue/50 group-hover:shadow-[0_0_15px_rgba(0,240,255,0.3)] 
                                                  transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                        {rule.icon}
                      </div>
                      <span className="font-mono text-xs text-white/20 group-hover:text-cyber-blue/60 transition-colors">
                        RULE {String(idx + 1).padStart(2, '0')}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="relative z-10">
                      <p className="text-gray-300 font-sans text-lg leading-relaxed group-hover:text-white transition-colors duration-300">
                        {rule.text}
                      </p>
                    </div>

                    {/* Decorative Corner */}
                    <div className="absolute bottom-0 right-0 w-8 h-8 overflow-hidden rounded-br-2xl">
                      <div className="absolute bottom-0 right-0 w-2 h-2 bg-white/10 group-hover:bg-cyber-blue group-hover:w-full group-hover:h-full transition-all duration-500"></div>
                    </div>
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

export default ThemeAndRules;